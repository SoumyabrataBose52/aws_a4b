import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, DateTime, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    creator_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    rate_limit: Mapped[int] = mapped_column(Integer, default=1000)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    source_agent: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
