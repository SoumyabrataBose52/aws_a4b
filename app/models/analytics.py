import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SentimentHistory(Base):
    __tablename__ = "sentiment_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), nullable=False, index=True)
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False)  # -1.0 to 1.0
    source_platform: Mapped[str | None] = mapped_column(String(50), nullable=True)
    message_text: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class PostingTimeSlot(Base):
    __tablename__ = "posting_time_slots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    hour: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-23
    total_posts: Mapped[int] = mapped_column(Integer, default=0)
    total_engagement: Mapped[float] = mapped_column(Float, default=0.0)
    avg_engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)
    score: Mapped[float] = mapped_column(Float, default=0.0)  # MAB score
    exploration_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
