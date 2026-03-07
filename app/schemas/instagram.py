"""Pydantic schemas for Instagram API endpoints."""
from pydantic import BaseModel
from typing import Optional


class InstagramAuthResponse(BaseModel):
    auth_url: str


class InstagramTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class InstagramProfile(BaseModel):
    id: str
    username: str
    name: str
    bio: str
    followers: int
    following: int
    media_count: int
    profile_picture: str
    website: str


class InstagramMediaItem(BaseModel):
    id: str
    caption: str
    media_type: str
    media_url: str
    thumbnail_url: str
    permalink: str
    timestamp: str
    likes: int
    comments: int


class InstagramInsightsValue(BaseModel):
    end_time: Optional[str] = None
    value: int | float = 0


class InstagramMetricData(BaseModel):
    title: str
    description: str
    values: list[InstagramInsightsValue]
    total: int | float


class InstagramAccountInsights(BaseModel):
    impressions: Optional[InstagramMetricData] = None
    reach: Optional[InstagramMetricData] = None
    follower_count: Optional[InstagramMetricData] = None
    profile_views: Optional[InstagramMetricData] = None


class InstagramComment(BaseModel):
    id: str
    text: str
    timestamp: str
    username: str
    likes: int
    replies: list[dict] = []


class InstagramAccountInfo(BaseModel):
    page_id: str
    page_name: str
    instagram_id: str
    id: str
    username: str
    name: str
    bio: str
    followers: int
    following: int
    media_count: int
    profile_picture: str
    website: str
