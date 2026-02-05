from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class ReminderStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=500)
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{10,14}$")
    timezone: str = "UTC"

class ReminderCreate(ReminderBase):
    scheduled_time: Optional[str] = None
    use_relative_time: bool = False
    days: Optional[int] = None
    hours: Optional[int] = None
    minutes: Optional[int] = None

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    message: Optional[str] = Field(None, min_length=1, max_length=500)
    phone_number: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{10,14}$")
    scheduled_time: Optional[str] = None
    timezone: Optional[str] = None
    status: Optional[ReminderStatus] = None
    use_relative_time: Optional[bool] = None
    days: Optional[int] = None
    hours: Optional[int] = None
    minutes: Optional[int] = None

class ReminderResponse(ReminderBase):
    id: int
    scheduled_time: datetime
    status: ReminderStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
