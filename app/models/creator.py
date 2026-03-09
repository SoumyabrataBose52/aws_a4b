import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, BigInteger, DateTime, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Creator(Base):
    __tablename__ = "creators"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, inactive, onboarding
    platforms: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # list of platform names
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # YouTube-specific fields
    youtube_channel_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    youtube_handle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subscribers: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    total_views: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    video_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    dna: Mapped["CreatorDNA | None"] = relationship("CreatorDNA", back_populates="creator", uselist=False, cascade="all, delete-orphan")
    content: Mapped[list["Content"]] = relationship("Content", back_populates="creator", cascade="all, delete-orphan")
    crises: Mapped[list["CrisisEvent"]] = relationship("CrisisEvent", back_populates="creator", cascade="all, delete-orphan")
    deals: Mapped[list["BrandDeal"]] = relationship("BrandDeal", back_populates="creator", cascade="all, delete-orphan")
    platform_connections: Mapped[list["PlatformConnection"]] = relationship("PlatformConnection", back_populates="creator", cascade="all, delete-orphan")
    media_kit: Mapped["MediaKit | None"] = relationship("MediaKit", back_populates="creator", uselist=False, cascade="all, delete-orphan")


class CreatorDNA(Base):
    __tablename__ = "creator_dna"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("creators.id", ondelete="CASCADE"), unique=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)

    # Linguistic Patterns (stored as JSON)
    linguistics: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="avg sentence length, variance, vocabulary, punctuation, paragraph structure")

    # Style Characteristics
    style: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="humor type, tone, formality, emoji usage")

    # Content Patterns
    content_patterns: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="posting cadence, preferred times, topic distribution, hashtag strategy")

    # Platform-Specific Variations
    platform_variations: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="per-platform style tweaks")

    analyzed_posts: Mapped[int] = mapped_column(Integer, default=0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator: Mapped["Creator"] = relationship("Creator", back_populates="dna")


# Avoid circular import — these are imported by name via string refs in relationships
from app.models.content import Content  # noqa: E402, F401
from app.models.crisis import CrisisEvent  # noqa: E402, F401
from app.models.deal import BrandDeal, MediaKit  # noqa: E402, F401
from app.models.platform import PlatformConnection  # noqa: E402, F401
