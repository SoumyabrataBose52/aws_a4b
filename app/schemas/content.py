from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# --- Content Schemas ---

class ContentGenerateRequest(BaseModel):
    creator_id: str
    platforms: list[str] = ["instagram"]
    topic: Optional[str] = None
    trend_id: Optional[str] = None
    language: str = "english"


class ContentCreate(BaseModel):
    creator_id: str
    text: str
    hashtags: Optional[list[str]] = None
    mentions: Optional[list[str]] = None
    platforms: Optional[list[str]] = None
    language: str = "english"
    generated_by: str = "human"


class ContentUpdate(BaseModel):
    text: Optional[str] = None
    hashtags: Optional[list[str]] = None
    mentions: Optional[list[str]] = None
    platforms: Optional[list[str]] = None
    status: Optional[str] = None
    language: Optional[str] = None


class ContentScheduleRequest(BaseModel):
    scheduled_time: datetime


class ContentResponse(BaseModel):
    id: str
    creator_id: str
    text: str
    hashtags: Optional[list[str]] = None
    mentions: Optional[list[str]] = None
    platforms: Optional[list[str]] = None
    status: str
    scheduled_time: Optional[datetime] = None
    published_time: Optional[datetime] = None
    language: str
    generated_by: str
    confidence_score: Optional[float] = None
    performance_prediction: Optional[dict] = None
    trend_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GeneratedContentResponse(BaseModel):
    content: ContentResponse
    style_match_score: float
    suggested_post_time: Optional[datetime] = None
    performance_prediction: Optional[dict] = None


# --- Performance Schemas ---

class PerformanceCreate(BaseModel):
    likes: int = 0
    comments: int = 0
    shares: int = 0
    views: int = 0
    engagement_rate: float = 0.0


class PerformanceResponse(BaseModel):
    id: str
    content_id: str
    likes: int
    comments: int
    shares: int
    views: int
    engagement_rate: float
    measured_at: datetime

    model_config = {"from_attributes": True}
