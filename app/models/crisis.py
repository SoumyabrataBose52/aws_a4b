import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CrisisEvent(Base):
    __tablename__ = "crisis_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, monitoring, resolved, escalated
    threat_level: Mapped[str] = mapped_column(String(20), default="low")  # low, medium, high, critical
    sentiment_drop: Mapped[float] = mapped_column(Float, default=0.0)
    affected_platforms: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    triggering_messages: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    lessons_learned: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    creator: Mapped["Creator"] = relationship("Creator", back_populates="crises")
    strategies: Mapped[list["ResponseStrategy"]] = relationship("ResponseStrategy", back_populates="crisis", cascade="all, delete-orphan")


class ResponseStrategy(Base):
    __tablename__ = "response_strategies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    crisis_id: Mapped[str] = mapped_column(String(36), ForeignKey("crisis_events.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # acknowledge, apologize, clarify, ignore, legal
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    target_platforms: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    predicted_sentiment_change: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_interval: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high
    historical_similarity: Mapped[float] = mapped_column(Float, default=0.0)
    selected: Mapped[bool] = mapped_column(default=False)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    crisis: Mapped["CrisisEvent"] = relationship("CrisisEvent", back_populates="strategies")


from app.models.creator import Creator  # noqa: E402, F401
