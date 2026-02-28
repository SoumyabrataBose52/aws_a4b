import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class BrandDeal(Base):
    __tablename__ = "brand_deals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="prospecting")  # prospecting, negotiating, accepted, rejected, completed
    proposed_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    final_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    deliverables: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    research_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    outreach_email: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_contact: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    conversion_success: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator: Mapped["Creator"] = relationship("Creator", back_populates="deals")


class MediaKit(Base):
    __tablename__ = "media_kits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), unique=True, nullable=False)
    follower_counts: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    engagement_rates: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    audience_demographics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    top_content: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    creator: Mapped["Creator"] = relationship("Creator", back_populates="media_kit")


from app.models.creator import Creator  # noqa: E402, F401
