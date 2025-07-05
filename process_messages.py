#!/usr/bin/env python3
"""
Simple script to process pending Slack messages from the database.
Run this every minute with cron: * * * * * /path/to/python process_messages.py
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from slackbot_db import init_db, process_pending_messages, get_pending_count

if __name__ == "__main__":
    init_db()
    
    # Process pending messages
    sent_count = process_pending_messages()
    pending_count = get_pending_count()
    
    if sent_count > 0:
        print(f"✅ Sent {sent_count} messages, {pending_count} still pending")
    elif pending_count > 0:
        print(f"⏳ {pending_count} messages pending")
    # Silent if no messages (for cron) 