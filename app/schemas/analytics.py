from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PerformancePredictionRequest(BaseModel):
    content_id: Optional[str] = None
    content_text: Optional[str] = None
    creator_id: str
    platform: str = "instagram"


class PerformancePredictionResponse(BaseModel):
    score: float  # 0-100
    expected_likes: int
    expected_comments: int
    expected_shares: int
    confidence_interval: list[float]
    factors: list[dict]


class PostingTimeSuggestion(BaseModel):
    day_of_week: int
    day_name: str
    hour: int
    score: float
    avg_engagement_rate: float


class EngagementForecast(BaseModel):
    creator_id: str
    forecast_period_start: datetime
    forecast_period_end: datetime
    projected_follower_growth: float
    projected_engagement_rate: float
    confidence_level: float
    underperforming_categories: list[str]
    suggested_pivots: list[str]


class DashboardMetrics(BaseModel):
    creator_id: str
    current_sentiment: float
    weekly_engagement: float
    follower_growth: float
    active_crises: int
    pending_deals: int
    total_content: int
    published_content: int
    avg_confidence_score: float
    success_metrics: dict


class CreatorComparison(BaseModel):
    creators: list[dict]
