from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# --- Brand Deal Schemas ---

class DealCreate(BaseModel):
    creator_id: str
    brand_name: str = Field(..., min_length=1, max_length=255)
    proposed_rate: Optional[float] = None
    deliverables: Optional[list[str]] = None
    deadline: Optional[datetime] = None


class DealUpdate(BaseModel):
    status: Optional[str] = None
    proposed_rate: Optional[float] = None
    final_rate: Optional[float] = None
    deliverables: Optional[list[str]] = None
    deadline: Optional[datetime] = None
    conversion_success: Optional[bool] = None


class DealResponse(BaseModel):
    id: str
    creator_id: str
    brand_name: str
    status: str
    proposed_rate: Optional[float] = None
    final_rate: Optional[float] = None
    deliverables: Optional[list[str]] = None
    deadline: Optional[datetime] = None
    research_data: Optional[dict] = None
    outreach_email: Optional[str] = None
    last_contact: Optional[datetime] = None
    conversion_success: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DealResearchResponse(BaseModel):
    deal_id: str
    suggested_rates: dict  # percentile25, percentile50, percentile75
    comparable_creators: list[str]
    brand_industry: str
    typical_requirements: list[str]
    negotiation_tips: list[str]


class OutreachRequest(BaseModel):
    tone: str = "formal"  # formal or casual


class CounterOfferResponse(BaseModel):
    deal_id: str
    suggested_amount: float
    reasoning: str
    negotiation_script: str


# --- Media Kit Schemas ---

class MediaKitResponse(BaseModel):
    id: str
    creator_id: str
    follower_counts: Optional[dict] = None
    engagement_rates: Optional[dict] = None
    audience_demographics: Optional[dict] = None
    top_content: Optional[list[dict]] = None
    pdf_path: Optional[str] = None
    generated_at: datetime

    model_config = {"from_attributes": True}
