from enum import Enum


class PlatformEnum(str, Enum):
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    X = "x"
    LINKEDIN = "linkedin"
    FACEBOOK = "facebook"
    SHARECHAT = "sharechat"
    MOJ = "moj"
    JOSH = "josh"
    CHINGARI = "chingari"


class RegionalLanguage(str, Enum):
    ENGLISH = "english"
    HINDI = "hindi"
    TAMIL = "tamil"
    TELUGU = "telugu"
    BENGALI = "bengali"
    MARATHI = "marathi"
    GUJARATI = "gujarati"
    KANNADA = "kannada"
    MALAYALAM = "malayalam"
    PUNJABI = "punjabi"
    ODIA = "odia"


class ContentStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"


class ThreatLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CrisisStatus(str, Enum):
    ACTIVE = "active"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class DealStatus(str, Enum):
    PROSPECTING = "prospecting"
    NEGOTIATING = "negotiating"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class StrategyType(str, Enum):
    ACKNOWLEDGE = "acknowledge"
    APOLOGIZE = "apologize"
    CLARIFY = "clarify"
    IGNORE = "ignore"
    LEGAL = "legal"


class HumorType(str, Enum):
    SARCASTIC = "sarcastic"
    WHOLESOME = "wholesome"
    DARK = "dark"
    OBSERVATIONAL = "observational"
    NONE = "none"


class ToneType(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    FRIENDLY = "friendly"
    AUTHORITATIVE = "authoritative"


# Pagination
from pydantic import BaseModel, Field
from typing import Generic, TypeVar, List

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None
