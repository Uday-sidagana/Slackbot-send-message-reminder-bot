# SlackBot Summary System

An automated system that receives Plain webhooks and schedules Slack reminders based on note content.

## 🚀 Quick Start

### 1. Start Everything with One Command
```bash
npm start
```

This single command will automatically start:
- ✅ **Webhook Server** (port 5001)
- ✅ **Python Scheduler** (checks DB every 30 seconds)
- ✅ **Message Processing** (sends scheduled messages to Slack)

### 2. Setup ngrok (separately)
In another terminal:
```bash
ngrok http 5001
```

### 3. Configure Plain Webhook
Use the ngrok URL in Plain:
```
https://your-ngrok-url.ngrok-free.app/handler
```

## 🔧 How It Works

1. **Plain sends webhook** → **Node.js server receives note events**
2. **Node.js server** → **Schedules messages in SQLite database**
3. **Python scheduler** → **Continuously checks database and sends due messages to Slack**

## 📝 Usage

Add a note in Plain with "Slackbot" to schedule a reminder:
- `"Slackbot: schedule in 5 minutes"`
- `"Slackbot: remind me in 1 hour"`
- `"Follow up tomorrow. Slackbot: schedule at 2pm"`

## 🛑 Stopping

Press `Ctrl+C` in the server terminal to stop all processes cleanly.

## 📁 Key Files

- `index.js` - Main webhook server + scheduler launcher
- `process_scheduler.py` - Continuous message processor
- `slackbot_db.py` - Database operations and Slack messaging
- `main.py` - Manual Plain API query script # Slackbot-send-message-reminder-bot
