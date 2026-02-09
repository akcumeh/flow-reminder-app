from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional
import os
import logging
import httpx

from .db import SessionLocal
from .models import Reminder, ReminderStatus
from . import crud

logger = logging.getLogger(__name__)

VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID")
VAPI_BASE_URL = "https://api.vapi.ai"

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

        if VAPI_API_KEY and VAPI_PHONE_NUMBER_ID:
            try:
                payload = {
                    "phoneNumberId": VAPI_PHONE_NUMBER_ID,
                    "customer": {
                        "number": reminder.phone_number,
                    },
                    "assistant": {
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
                }

                headers = {
                    "Authorization": f"Bearer {VAPI_API_KEY}",
                    "Content-Type": "application/json"
                }

                with httpx.Client() as client:
                    response = client.post(
                        f"{VAPI_BASE_URL}/call",
                        json=payload,
                        headers=headers,
                        timeout=30.0
                    )
                    response.raise_for_status()

                logger.info(f"Vapi call initiated for reminder {reminder_id}")
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

def check_overdue_reminders():
    """
    Periodic job that marks past-due pending reminders as failed.
    Runs every minute to catch missed reminders.
    """
    db: Session = SessionLocal()
    try:
        now_utc = datetime.now(ZoneInfo("UTC"))
        reminders = db.query(Reminder).filter(
            Reminder.status == ReminderStatus.PENDING,
            Reminder.scheduled_time < now_utc
        ).all()

        for reminder in reminders:
            logger.warning(f"Reminder {reminder.id} is overdue, marking as failed")
            crud.update_reminder_status(db, reminder.id, ReminderStatus.FAILED)
            unschedule_reminder(reminder.id)
    except Exception as e:
        logger.error(f"Error checking overdue reminders: {str(e)}")
    finally:
        db.close()

def start_scheduler():
    """Start the scheduler (called on app startup)"""
    if not scheduler.running:
        scheduler.start()

        scheduler.add_job(
            check_overdue_reminders,
            trigger=IntervalTrigger(minutes=1),
            id="check_overdue",
            name="Check overdue reminders",
            replace_existing=True
        )

        logger.info("APScheduler started")

def shutdown_scheduler():
    """Gracefully shutdown scheduler (called on app shutdown)"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped")
