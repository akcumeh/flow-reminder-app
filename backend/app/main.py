from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import logging

from . import crud, models, schemas
from .db import engine, get_db
from .scheduler import (
    scheduler,
    start_scheduler,
    shutdown_scheduler,
    schedule_reminder,
    unschedule_reminder
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Flow Reminder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Start the scheduler when the app starts"""

    start_scheduler()
    logger.info("API server started")


@app.on_event("shutdown")
async def shutdown_event():
    """Gracefully shut down the scheduler"""

    shutdown_scheduler()
    logger.info("API server stopped")


@app.get("/")
def root():
    """Heatlh check"""

    return {"status": "ok", "message": "Flow Reminder API"}


@app.get("/api/reminders", response_model=List[schemas.ReminderResponse])
def get_reminders(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all reminders, with the possibility of filtering by status"""

    return crud.get_reminders(db, status=status, skip=skip, limit=limit)


@app.get("/api/reminders/{reminder_id}", response_model=schemas.ReminderResponse)
def get_reminder(reminder_id: int, db: Session = Depends(get_db)):
    """Get single reminder by ID"""
    reminder = crud.get_reminder(db, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@app.post("/api/reminders", response_model=schemas.ReminderResponse, status_code=201)
def create_reminder(
    reminder: schemas.ReminderCreate,
    db: Session = Depends(get_db)
):
    """Create new reminder and schedule it"""
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    logger.info(f"Received create request: use_relative_time={reminder.use_relative_time}")

    if reminder.use_relative_time:
        days = reminder.days or 0
        hours = reminder.hours or 0
        minutes = reminder.minutes or 0

        now_utc = datetime.now(ZoneInfo("UTC"))
        scheduled_utc = now_utc + timedelta(days=days, hours=hours, minutes=minutes)

        reminder_data = reminder.model_dump()
        reminder_data['scheduled_time'] = scheduled_utc
    else:
        from datetime import datetime as dt
        user_tz = ZoneInfo(reminder.timezone)
        local_time = dt.fromisoformat(reminder.scheduled_time)

        if local_time.tzinfo is None:
            local_time = local_time.replace(tzinfo=user_tz)

        scheduled_utc = local_time.astimezone(ZoneInfo("UTC"))

        reminder_data = reminder.model_dump()
        reminder_data['scheduled_time'] = scheduled_utc

    db_reminder = crud.create_reminder(db, reminder_data)

    try:
        schedule_reminder(db_reminder)
    except Exception as e:
        logger.error(f"Failed to schedule reminder {db_reminder.id}: {str(e)}")

    return db_reminder


@app.put("/api/reminders/{reminder_id}", response_model=schemas.ReminderResponse)
def update_reminder(
    reminder_id: int,
    reminder: schemas.ReminderUpdate,
    db: Session = Depends(get_db)
):
    """Update existing reminder and reschedule if time changed"""
    from datetime import datetime as dt

    reminder_data = reminder.model_dump(exclude_unset=True)

    if reminder_data.get('use_relative_time'):
        days = reminder_data.get('days', 0)
        hours = reminder_data.get('hours', 0)
        minutes = reminder_data.get('minutes', 0)

        now_utc = datetime.now(ZoneInfo("UTC"))
        scheduled_utc = now_utc + timedelta(days=days, hours=hours, minutes=minutes)
        reminder_data['scheduled_time'] = scheduled_utc
    elif 'scheduled_time' in reminder_data and reminder_data['scheduled_time']:
        user_tz = ZoneInfo(reminder_data.get('timezone', 'UTC'))
        local_time = dt.fromisoformat(reminder_data['scheduled_time'])

        if local_time.tzinfo is None:
            local_time = local_time.replace(tzinfo=user_tz)

        scheduled_utc = local_time.astimezone(ZoneInfo("UTC"))
        reminder_data['scheduled_time'] = scheduled_utc

    db_reminder = crud.get_reminder(db, reminder_id)
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    for key, value in reminder_data.items():
        if key not in ['use_relative_time', 'days', 'hours', 'minutes']:
            setattr(db_reminder, key, value)

    if 'scheduled_time' in reminder_data:
        now_utc = datetime.now(ZoneInfo("UTC"))
        if reminder_data['scheduled_time'] > now_utc and db_reminder.status in [models.ReminderStatus.FAILED, models.ReminderStatus.COMPLETED]:
            db_reminder.status = models.ReminderStatus.PENDING

    db_reminder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_reminder)

    if 'scheduled_time' in reminder_data and db_reminder.status == models.ReminderStatus.PENDING:
        try:
            schedule_reminder(db_reminder)
        except Exception as e:
            logger.error(f"Failed to reschedule reminder {reminder_id}: {str(e)}")

    return db_reminder


@app.delete("/api/reminders/{reminder_id}", status_code=204)
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    """Remove from scheduler then delete"""
    try:
        unschedule_reminder(reminder_id)
    except Exception as e:
        logger.error(f"Failed to unschedule reminder {reminder_id}: {str(e)}")
    
    deleted = crud.delete_reminder(db, reminder_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return None
