#!/usr/bin/env python3
import time
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from slackbot_db import process_pending_messages_with_window, get_pending_count

# India timezone
india_tz = pytz.timezone('Asia/Kolkata')

def calculate_next_scan_time():
    """
    Calculate the next 10-minute multiple for scanning
    Examples:
    - 12:53AM → 1:00AM
    - 12:33AM → 12:40AM  
    - 1:30PM → 1:40PM
    """
    current_time = datetime.now(india_tz)
    current_minute = current_time.minute
    
    # Calculate next 10-minute multiple
    if current_minute % 10 == 0:
        # Already at 10-minute multiple, use next one
        next_scan_minute = current_minute + 10
    else:
        # Find next multiple
        next_scan_minute = ((current_minute // 10) + 1) * 10
    
    # Handle hour overflow
    if next_scan_minute >= 60:
        next_scan_minute = 0
        next_hour = current_time.hour + 1
        
        # Handle day overflow
        if next_hour >= 24:
            next_hour = 0
            next_scan_time = current_time.replace(hour=next_hour, minute=next_scan_minute, second=0, microsecond=0) + timedelta(days=1)
        else:
            next_scan_time = current_time.replace(hour=next_hour, minute=next_scan_minute, second=0, microsecond=0)
    else:
        next_scan_time = current_time.replace(minute=next_scan_minute, second=0, microsecond=0)
    
    return next_scan_time

def calculate_initial_wait_time():
    """
    Calculate seconds to wait until next 10-minute multiple
    """
    current_time = datetime.now(india_tz)
    next_scan_time = calculate_next_scan_time()
    
    wait_seconds = (next_scan_time - current_time).total_seconds()
    return wait_seconds, next_scan_time

def run_scheduler():
    """
    Optimized scheduler that scans every 10 minutes at 10-minute multiples
    with ±2 minute window for sending reminders
    """
    print("🚀 Starting Optimized SlackBot scheduler...")
    print("⏰ Scanning every 10 minutes at 10-minute multiples (1:00, 1:10, 1:20, etc.)")
    print("🎯 Sending reminders within ±2 minutes of scan time")
    print("🛑 Press Ctrl+C to stop")
    
    try:
        # Calculate initial wait time to sync with 10-minute multiples
        wait_seconds, next_scan_time = calculate_initial_wait_time()
        
        current_time = datetime.now(india_tz)
        print(f"\n📅 Current time: {current_time.strftime('%Y-%m-%d %H:%M:%S IST')}")
        print(f"⏳ Next scan at: {next_scan_time.strftime('%Y-%m-%d %H:%M:%S IST')}")
        print(f"🕐 Waiting {wait_seconds:.0f} seconds until next scan...")
        
        # Wait until next 10-minute multiple
        time.sleep(wait_seconds)
        
        # Main scanning loop
        while True:
            scan_time = datetime.now(india_tz)
            print(f"\n🔍 Scanning at {scan_time.strftime('%Y-%m-%d %H:%M:%S IST')}")
            
            # Check for pending messages within ±2 minutes
            pending_count = get_pending_count()
            
            if pending_count > 0:
                print(f"📋 Found {pending_count} pending messages, checking window...")
                sent_count = process_pending_messages_with_window()
                if sent_count > 0:
                    print(f"✅ Sent {sent_count} messages")
                else:
                    print("⏸️ No messages in current 2-minute window")
            else:
                print("✨ No pending messages")
            
            # Wait exactly 10 minutes until next scan
            print("⏱️ Waiting 10 minutes until next scan...")
            time.sleep(600)  # 10 minutes = 600 seconds
            
    except KeyboardInterrupt:
        print("\n🛑 Scheduler stopped by user")
    except Exception as e:
        print(f"\n❌ Scheduler error: {e}")
        print("🔄 Restarting in 5 seconds...")
        time.sleep(5)
        run_scheduler()  # Restart on error

if __name__ == "__main__":
    run_scheduler() 