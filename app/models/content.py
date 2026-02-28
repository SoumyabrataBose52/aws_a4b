import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Content(Base):
    __tablename__ = "content"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    hashtags: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    mentions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    platforms: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, scheduled, published, failed
    scheduled_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    published_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    language: Mapped[str] = mapped_column(String(20), default="english")
    generated_by: Mapped[str] = mapped_column(String(10), default="human")  # human, ai
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    performance_prediction: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    trend_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    creator: Mapped["Creator"] = relationship("Creator", back_populates="content")
    performance: Mapped["Performance | None"] = relationship("Performance", back_populates="content", uselist=False, cascade="all, delete-orphan")


class Performance(Base):
    __tablename__ = "performance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id: Mapped[str] = mapped_column(String(36), ForeignKey("content.id", ondelete="CASCADE"), unique=True, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)
    views: Mapped[int] = mapped_column(Integer, default=0)
    engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)
    measured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    content: Mapped["Content"] = relationship("Content", back_populates="performance")


# Avoid circular import
from app.models.creator import Creator  # noqa: E402, F401
