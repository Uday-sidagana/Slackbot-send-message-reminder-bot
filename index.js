import express from "express";
import {
  PlainWebhookSignatureVerificationError,
  PlainWebhookVersionMismatchError,
  verifyPlainWebhook,
} from "@team-plain/typescript-sdk";
import { spawn } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration - Load from environment variables
const PLAIN_SIGNATURE_SECRET = process.env.PLAIN_SIGNATURE_SECRET;

// Validation
if (!PLAIN_SIGNATURE_SECRET) {
  throw new Error("PLAIN_SIGNATURE_SECRET environment variable is required");
}

// Additional validation for other required environment variables
const requiredEnvVars = ["PLAIN_SIGNATURE_SECRET"];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Schedule message using SQLite database
async function scheduleSlackbotMessage(noteText, threadId) {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [
      '-c',
      `
import sys
sys.path.append('.')
from slackbot_db import init_db, schedule_message
init_db()
result = schedule_message("${noteText.replace(/"/g, '\\"')}", "${threadId}")
print(f"DB_ID:{result}" if result else "NO_SCHEDULE")
      `
    ]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (output.includes('DB_ID:')) {
        const dbId = output.split('DB_ID:')[1].trim();
        console.log(`📅 Message scheduled with DB ID: ${dbId}`);
        resolve(dbId);
      } else {
        resolve(null);
      }
    });

    pythonProcess.on('error', () => {
      resolve(null);
    });
  });
}

const app = express();
app.use(express.text({ type: 'application/json' }));

app.post("/handler", function (req, res) {
  console.log("Webhook received:", {
    headers: req.headers,
    body: req.body,
    bodyType: typeof req.body,
  });

  // Please note that you must pass the raw request body, exactly as received from Plain,
  const payload = req.body;

  // Plain's computed signature for the request.
  const signature = req.get("Plain-Request-Signature");

  if (!signature) {
    console.error("Missing Plain-Request-Signature header");
    return res.status(400).send("Missing Plain-Request-Signature header");
  }

  const webhookResult = verifyPlainWebhook(
    payload,
    signature,
    PLAIN_SIGNATURE_SECRET,
  );

  if (webhookResult.error instanceof PlainWebhookSignatureVerificationError) {
    console.error("Webhook signature verification failed");
    res.status(401).send("Failed to verify the webhook signature");
    return;
  }

  if (webhookResult.error instanceof PlainWebhookVersionMismatchError) {
    // The SDK is not compatible with the received webhook version.
    // This can happen if you upgrade the SDK but not the webhook target, or vice versa.
    // We recommend setting up alerts to notify you when this happens.
    // Consult https://plain.com/docs/api-reference/webhooks/versions for more information.
    console.error("Webhook version mismatch:", webhookResult.error.message);

    // Respond with a non-2XX status code to trigger a retry from Plain.
    res.status(400).send("Webhook version mismatch");
    return;
  }

  if (webhookResult.error) {
    // Unexpected error. Most likely due to an error in Plain's webhook server or a bug in the SDK.
    // Treat this as a 500 response from Plain.
    console.error("Unexpected error:", webhookResult.error.message);
    res.status(500).send("Unexpected error");
    return;
  }

  // webhookResult.data is now a typed object.
  const webhookBody = webhookResult.data;

  console.log("Webhook verified successfully:", {
    eventType: webhookBody.payload.eventType,
    threadId: webhookBody.payload.thread?.id,
  });

  // Handle note creation events
  if (webhookBody.payload.eventType === "thread.note_created") {
    const noteText = webhookBody.payload.note.text;
    const threadId = webhookBody.payload.thread?.id;
    
    console.log(`✅ Note created in thread: ${threadId}`);
    console.log(`📝 Note text: "${noteText}"`);
    
    // Process the note for Slackbot scheduling using SQLite database
    scheduleSlackbotMessage(noteText, threadId);
  } else {
    console.log(
      `ℹ️ Received event: ${webhookBody.payload.eventType} (not handling this event type)`,
    );
  }

  // Respond with a 200 status code.
  res.status(200).send("Webhook received");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;

// Global variable to store the scheduler process
let schedulerProcess = null;

// Function to start the Python scheduler
function startPythonScheduler() {
  console.log("🚀 Starting Python scheduler...");
  
  // Use the virtual environment Python if it exists
  const pythonCmd = process.platform === 'win32' ? 'venv\\Scripts\\python.exe' : 'venv/bin/python';
  const fallbackPython = 'python';
  
  // Try venv python first, fall back to system python
  const useVenvPython = fs.existsSync(pythonCmd);
  const finalPythonCmd = useVenvPython ? pythonCmd : fallbackPython;
  
  console.log(`📍 Using Python: ${finalPythonCmd}`);
  
  schedulerProcess = spawn(finalPythonCmd, ['process_scheduler.py'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  schedulerProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output && output !== '.') {
      console.log(`[Scheduler] ${output}`);
    }
  });

  schedulerProcess.stderr.on('data', (data) => {
    console.error(`[Scheduler Error] ${data.toString().trim()}`);
  });

  schedulerProcess.on('close', (code) => {
    console.log(`[Scheduler] Process exited with code ${code}`);
    if (code !== 0) {
      console.log("🔄 Restarting scheduler in 5 seconds...");
      setTimeout(startPythonScheduler, 5000);
    }
  });

  schedulerProcess.on('error', (error) => {
    console.error(`[Scheduler] Failed to start: ${error.message}`);
    setTimeout(startPythonScheduler, 5000);
  });
}

// Function to stop the scheduler gracefully
function stopScheduler() {
  if (schedulerProcess) {
    console.log("🛑 Stopping Python scheduler...");
    schedulerProcess.kill('SIGTERM');
    schedulerProcess = null;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  stopScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  stopScheduler();
  process.exit(0);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Simple webhook server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://0.0.0.0:${PORT}/handler`);
  
  // Start the Python scheduler automatically
  startPythonScheduler();
  
  console.log("✅ All services started successfully!");
  console.log("📡 Webhook server + Python scheduler are now running");
});
