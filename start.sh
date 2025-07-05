#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PORT=5001
PROJECT_DIR="$(pwd)"

echo -e "${BLUE}🚀 Starting SlackBot Summary System${NC}"
echo -e "${BLUE}====================================${NC}"

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Cleaning up processes...${NC}"
    
    # Kill ngrok
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null
        echo -e "${GREEN}✅ ngrok stopped${NC}"
    fi
    
    # Kill Node.js server (which will also kill the Python scheduler)
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo -e "${GREEN}✅ Server stopped${NC}"
    fi
    
    echo -e "${GREEN}🏁 All processes stopped cleanly${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo -e "${YELLOW}📋 Checking dependencies...${NC}"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install ngrok first: https://ngrok.com/download${NC}"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
    npm install
fi

# Check if Python virtual environment is activated
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Python virtual environment not found${NC}"
    echo -e "${YELLOW}Please create a virtual environment first: python -m venv venv${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies found${NC}"

echo -e "\n${BLUE}🔧 Starting services...${NC}"

# Start ngrok in background
echo -e "${YELLOW}🌐 Starting ngrok tunnel...${NC}"
ngrok http $PORT --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and get the URL
echo -e "${YELLOW}⏳ Waiting for ngrok to start...${NC}"
sleep 3

# Get ngrok URL
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URL${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ ngrok tunnel active: ${NGROK_URL}${NC}"
echo -e "${BLUE}📡 Webhook URL: ${NGROK_URL}/handler${NC}"

# Start the Node.js server (which will automatically start the Python scheduler)
echo -e "\n${YELLOW}🚀 Starting webhook server...${NC}"
npm start &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

echo -e "\n${GREEN}🎉 All services are running!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}📡 Webhook Server:${NC} http://localhost:$PORT"
echo -e "${GREEN}🌐 Public URL:${NC} $NGROK_URL"
echo -e "${GREEN}🎯 Webhook Endpoint:${NC} $NGROK_URL/handler"
echo -e "${GREEN}🔍 ngrok Web Interface:${NC} http://localhost:4040"
echo -e "${BLUE}===========================================${NC}"
echo -e "\n${YELLOW}📝 Configure this webhook URL in Plain:${NC}"
echo -e "${BLUE}$NGROK_URL/handler${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for the server process
wait $SERVER_PID 