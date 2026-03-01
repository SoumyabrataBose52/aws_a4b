from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# --- Creator Schemas ---

class CreatorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    bio: Optional[str] = None
    platforms: Optional[list[str]] = None
    avatar_url: Optional[str] = None
    youtube_channel_id: Optional[str] = None
    youtube_handle: Optional[str] = None
    subscribers: Optional[int] = None
    total_views: Optional[int] = None
    video_count: Optional[int] = None


class CreatorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None
    platforms: Optional[list[str]] = None
    avatar_url: Optional[str] = None
    youtube_channel_id: Optional[str] = None
    youtube_handle: Optional[str] = None
    subscribers: Optional[int] = None
    total_views: Optional[int] = None
    video_count: Optional[int] = None


class CreatorResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    bio: Optional[str] = None
    status: str
    platforms: Optional[list[str]] = None
    avatar_url: Optional[str] = None
    youtube_channel_id: Optional[str] = None
    youtube_handle: Optional[str] = None
    subscribers: Optional[int] = None
    total_views: Optional[int] = None
    video_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Creator DNA Schemas ---

class LinguisticsProfile(BaseModel):
    average_sentence_length: float = 15.0
    sentence_length_variance: float = 5.0
    vocabulary_preferences: dict[str, float] = {}
    punctuation_style: dict = {}
    paragraph_structure: dict = {}


class StyleProfile(BaseModel):
    humor_type: str = "none"
    tone: str = "casual"
    formality_level: float = 5.0
    emoji_usage: dict = {}


class ContentPatternsProfile(BaseModel):
    posting_cadence: str = "weekly"
    preferred_post_times: list[str] = []
    topic_distribution: dict[str, float] = {}
    hashtag_strategy: dict = {}


class CreatorDNAUpdate(BaseModel):
    linguistics: Optional[LinguisticsProfile] = None
    style: Optional[StyleProfile] = None
    content_patterns: Optional[ContentPatternsProfile] = None
    platform_variations: Optional[dict] = None


class CreatorDNAResponse(BaseModel):
    id: str
    creator_id: str
    version: int
    linguistics: Optional[dict] = None
    style: Optional[dict] = None
    content_patterns: Optional[dict] = None
    platform_variations: Optional[dict] = None
    analyzed_posts: int
    confidence_score: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreatorDetailResponse(CreatorResponse):
    dna: Optional[CreatorDNAResponse] = None
