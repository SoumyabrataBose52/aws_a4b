import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class TrendAlert(Base):
    __tablename__ = "trend_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    platforms: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    current_velocity: Mapped[float] = mapped_column(Float, default=0.0)
    predicted_peak_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    urgency_level: Mapped[str] = mapped_column(String(20), default="low")  # low, medium, high, critical
    suggested_creators: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, peaked, expired
    accuracy_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
