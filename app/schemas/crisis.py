from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# --- Crisis Schemas ---

class CrisisCreate(BaseModel):
    creator_id: str
    threat_level: str = "low"
    sentiment_drop: float = 0.0
    affected_platforms: Optional[list[str]] = None
    triggering_messages: Optional[list[str]] = None


class CrisisUpdate(BaseModel):
    status: Optional[str] = None
    threat_level: Optional[str] = None
    resolved_at: Optional[datetime] = None
    lessons_learned: Optional[list[str]] = None


class CrisisResponse(BaseModel):
    id: str
    creator_id: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    status: str
    threat_level: str
    sentiment_drop: float
    affected_platforms: Optional[list[str]] = None
    triggering_messages: Optional[list[str]] = None
    lessons_learned: Optional[list[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CrisisDetailResponse(CrisisResponse):
    strategies: list["StrategyResponse"] = []


# --- Response Strategy Schemas ---

class StrategyGenerateRequest(BaseModel):
    count: int = Field(3, ge=3, le=5)


class StrategyResponse(BaseModel):
    id: str
    crisis_id: str
    type: str
    response_text: str
    target_platforms: Optional[list[str]] = None
    predicted_sentiment_change: float
    confidence_interval: Optional[dict] = None
    risk_level: str
    historical_similarity: float
    selected: bool
    executed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SimulationRequest(BaseModel):
    strategy_id: str


class SimulationResponse(BaseModel):
    strategy_id: str
    predicted_sentiment_change: float
    confidence_interval: list[float]
    risk_level: str
    historical_similarity: float
    estimated_recovery_hours: float


class ExecuteStrategyRequest(BaseModel):
    strategy_id: str


# --- Sentiment Schemas ---

class SentimentRecordRequest(BaseModel):
    creator_id: str
    sentiment_score: float = Field(..., ge=-1.0, le=1.0)
    source_platform: Optional[str] = None
    message_text: Optional[str] = None


class SentimentResponse(BaseModel):
    id: str
    creator_id: str
    sentiment_score: float
    source_platform: Optional[str] = None
    message_text: Optional[str] = None
    recorded_at: datetime

    model_config = {"from_attributes": True}


class SentimentSummary(BaseModel):
    creator_id: str
    current_score: float
    average_7d: float
    trend: str  # "rising", "falling", "stable"
    anomaly_detected: bool
    data_points: int


# --- Comment Analysis Schemas ---

class CommentAnalyzeRequest(BaseModel):
    video_id: str
    creator_id: Optional[str] = None
    interval_seconds: int = Field(30, ge=5, le=3600)
    max_comments: int = Field(100, ge=10, le=500)


class CommentSentimentItem(BaseModel):
    comment_id: str = ""
    author: str = ""
    text: str
    likes: int = 0
    published_at: str = ""
    sentiment_score: float
    sentiment_label: str
    confidence: float
    star_rating: int


class TimeIntervalSnapshot(BaseModel):
    interval_index: int
    start: str
    end: str
    comment_count: int
    avg_score: float
    min_score: float = 0.0
    max_score: float = 0.0


class AlertItem(BaseModel):
    severity: str  # "info", "warning", "critical"
    message: str
    keyword: str = ""


class CommentAnalysisResponse(BaseModel):
    id: Optional[str] = None
    video_id: str
    creator_id: Optional[str] = None
    total_comments: int
    avg_sentiment: float
    sentiment_distribution: dict
    most_negative: list[dict] = []
    most_positive: list[dict] = []
    anomaly_detected: bool = False
    anomaly_message: Optional[str] = None
    keywords: dict = {}
    alerts: list[dict] = []
    time_intervals: list[dict] = []
    gemini_summary: str = ""
    comments: list[dict] = []
    analyzed_at: str = ""


class CommentAnalysisListItem(BaseModel):
    id: str
    video_id: str
    creator_id: Optional[str] = None
    total_comments: int
    avg_sentiment: float
    anomaly_detected: bool = False
    gemini_summary: Optional[str] = None
    analyzed_at: datetime

    model_config = {"from_attributes": True}

    @property
    def anomaly_from_alerts(self) -> bool:
        return False

