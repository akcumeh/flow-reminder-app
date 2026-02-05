from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from datetime import datetime
import enum
from .db import Base

class ReminderStatus(enum.Enum):
    """Status of reminder: pending, completed, failed"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    message = Column(String(500), nullable=False)
    phone_number = Column(String(20), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    timezone = Column(String(50), nullable=False, default="UTC")
    status = Column(SQLEnum(ReminderStatus), default=ReminderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
