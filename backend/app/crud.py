from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import datetime
from . import models, schemas

def get_reminders(
    db: Session, 
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[models.Reminder]:
    """Get all reminders, optionally filtered by status"""
    query = db.query(models.Reminder)
    
    if status:
        try:
            status_enum = models.ReminderStatus(status)
            query = query.filter(models.Reminder.status == status_enum)
        except ValueError:
            pass  # Invalid status, return all
    
    return query.order_by(models.Reminder.scheduled_time.desc()).offset(skip).limit(limit).all()

def get_reminder(db: Session, reminder_id: int) -> Optional[models.Reminder]:
    """Get single reminder by ID"""
    return db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()

def create_reminder(db: Session, reminder: schemas.ReminderCreate) -> models.Reminder:
    """Create new reminder"""
    db_reminder = models.Reminder(**reminder.model_dump())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

def update_reminder(
    db: Session, 
    reminder_id: int, 
    reminder: schemas.ReminderUpdate
) -> Optional[models.Reminder]:
    """Update existing reminder"""
    db_reminder = get_reminder(db, reminder_id)
    if not db_reminder:
        return None
    
    update_data = reminder.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_reminder, key, value)
    
    db_reminder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

def delete_reminder(db: Session, reminder_id: int) -> bool:
    """Delete reminder, returns True if deleted"""
    db_reminder = get_reminder(db, reminder_id)
    if not db_reminder:
        return False
    
    db.delete(db_reminder)
    db.commit()
    return True

def update_reminder_status(
    db: Session, 
    reminder_id: int, 
    status: models.ReminderStatus
) -> Optional[models.Reminder]:
    """Update only the status (used by scheduler)"""
    db_reminder = get_reminder(db, reminder_id)
    if not db_reminder:
        return None
    
    db_reminder.status = status
    db_reminder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_reminder)
    return db_reminder
