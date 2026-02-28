from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TrendCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    platforms: Optional[list[str]] = None
    current_velocity: float = 0.0
    predicted_peak_time: Optional[datetime] = None
    urgency_level: str = "low"
    suggested_creators: Optional[list[str]] = None


class TrendUpdate(BaseModel):
    topic: Optional[str] = None
    description: Optional[str] = None
    platforms: Optional[list[str]] = None
    current_velocity: Optional[float] = None
    predicted_peak_time: Optional[datetime] = None
    urgency_level: Optional[str] = None
    suggested_creators: Optional[list[str]] = None
    status: Optional[str] = None
    accuracy_score: Optional[float] = None


class TrendResponse(BaseModel):
    id: str
    topic: str
    description: Optional[str] = None
    platforms: Optional[list[str]] = None
    current_velocity: float
    predicted_peak_time: Optional[datetime] = None
    urgency_level: str
    suggested_creators: Optional[list[str]] = None
    status: str
    accuracy_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreatorMatchResponse(BaseModel):
    creator_id: str
    creator_name: str
    alignment_score: float
    audience_overlap: float
    reasoning: str
