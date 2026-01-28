from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
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
    allow_origins=["http://localhost:3000"], # Next.js frontend is running on this port
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
    db_reminder = crud.create_reminder(db, reminder)
    
    # Schedule the reminder job
    try:
        schedule_reminder(db_reminder)
    except Exception as e:
        logger.error(f"Failed to schedule reminder {db_reminder.id}: {str(e)}")
        # Still return the created reminder, but log the scheduling error
    
    return db_reminder


@app.put("/api/reminders/{reminder_id}", response_model=schemas.ReminderResponse)
def update_reminder(
    reminder_id: int,
    reminder: schemas.ReminderUpdate,
    db: Session = Depends(get_db)
):
    """Update existing reminder and reschedule if time changed"""
    db_reminder = crud.update_reminder(db, reminder_id, reminder)
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    # Reschedule if scheduled_time was updated and status is still pending
    if reminder.scheduled_time and db_reminder.status == models.ReminderStatus.PENDING:
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
