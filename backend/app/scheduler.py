from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import os
import logging
from vapi import Vapi

from .database import SessionLocal
from .models import Reminder, ReminderStatus
from . import crud

logger = logging.getLogger(__name__)

# Initialize Vapi client
VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID")

vapi_client = Vapi(api_key=VAPI_API_KEY) if VAPI_API_KEY else None

# Global scheduler instance
scheduler = BackgroundScheduler()

def trigger_reminder_call(reminder_id: int):
    """
    Called by scheduler at reminder time.
    Makes Vapi call and updates status.
    """
    db: Session = SessionLocal()
    try:
        reminder = crud.get_reminder(db, reminder_id)
        if not reminder:
            logger.error(f"Reminder {reminder_id} not found")
            return
        
        if reminder.status != ReminderStatus.PENDING:
            logger.info(f"Reminder {reminder_id} already processed, skipping")
            return
        
        # Make Vapi call
        if vapi_client and VAPI_PHONE_NUMBER_ID:
            try:
                call_response = vapi_client.calls.create(
                    phone_number_id=VAPI_PHONE_NUMBER_ID,
                    customer_number=reminder.phone_number,
                    assistant={
                        "firstMessage": f"Hello! This is your reminder: {reminder.title}. {reminder.message}",
                        "model": {
                            "provider": "openai",
                            "model": "gpt-3.5-turbo",
                            "messages": [
                                {
                                    "role": "system",
                                    "content": "You are a friendly reminder assistant. After delivering the reminder message, politely end the call."
                                }
                            ]
                        },
                        "voice": {
                            "provider": "playht",
                            "voiceId": "jennifer"
                        }
                    }
                )
                
                logger.info(f"Vapi call initiated for reminder {reminder_id}: {call_response}")
                crud.update_reminder_status(db, reminder_id, ReminderStatus.COMPLETED)
                
            except Exception as e:
                logger.error(f"Vapi call failed for reminder {reminder_id}: {str(e)}")
                crud.update_reminder_status(db, reminder_id, ReminderStatus.FAILED)
        else:
            logger.warning("Vapi not configured, marking as completed (dev mode)")
            crud.update_reminder_status(db, reminder_id, ReminderStatus.COMPLETED)
            
    except Exception as e:
        logger.error(f"Error processing reminder {reminder_id}: {str(e)}")
        try:
            crud.update_reminder_status(db, reminder_id, ReminderStatus.FAILED)
        except:
            pass
    finally:
        db.close()

def schedule_reminder(reminder: Reminder):
    """
    Adds reminder to APScheduler queue.
    Called when creating new reminders.
    """
    job_id = f"reminder_{reminder.id}"
    
    # Remove existing job if rescheduling
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    
    scheduler.add_job(
        trigger_reminder_call,
        trigger=DateTrigger(run_date=reminder.scheduled_time),
        args=[reminder.id],
        id=job_id,
        name=f"Reminder: {reminder.title}",
        replace_existing=True
    )
    
    logger.info(f"Scheduled reminder {reminder.id} for {reminder.scheduled_time}")

def unschedule_reminder(reminder_id: int):
    """Remove reminder from scheduler (for deletions)"""
    job_id = f"reminder_{reminder_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info(f"Unscheduled reminder {reminder_id}")

def start_scheduler():
    """Start the scheduler (called on app startup)"""
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started")

def shutdown_scheduler():
    """Gracefully shutdown scheduler (called on app shutdown)"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped")
