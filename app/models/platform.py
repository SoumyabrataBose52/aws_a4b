import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PlatformConnection(Base):
    __tablename__ = "platform_connections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # instagram, youtube, tiktok, x, linkedin, facebook, sharechat, moj, josh, chingari
    status: Mapped[str] = mapped_column(String(20), default="connected")  # connected, disconnected, error
    access_token: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    token_expiry: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sync_frequency: Mapped[int] = mapped_column(default=15)  # minutes
    permissions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    creator: Mapped["Creator"] = relationship("Creator", back_populates="platform_connections")


from app.models.creator import Creator  # noqa: E402, F401
