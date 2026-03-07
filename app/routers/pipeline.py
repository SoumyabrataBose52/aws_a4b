"""Pipeline router — multi-platform data processing and analysis."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/pipeline", tags=["Data Pipeline"], dependencies=[Depends(verify_api_key)])


class PipelineAnalyzeRequest(BaseModel):
    youtube_channel_id: Optional[str] = None
    instagram_user_id: Optional[str] = None
    instagram_token: Optional[str] = None
    max_items: int = 20


class AutoAnalyzeRequest(BaseModel):
    youtube_channel_id: Optional[str] = None
    instagram_user_id: Optional[str] = None
    instagram_token: Optional[str] = None
    analysis_type: str = "full"  # full, content, audience, performance
    max_items: int = 20


@router.post("/analyze")
async def analyze_platforms(req: PipelineAnalyzeRequest):
    """Full multi-platform analysis for a creator — fetches data from YouTube/Instagram, normalizes, and sends to Gemini."""
    from app.services.data_pipeline import analyze_creator_platforms
    result = await analyze_creator_platforms(
        youtube_channel_id=req.youtube_channel_id,
        instagram_user_id=req.instagram_user_id,
        instagram_token=req.instagram_token,
        max_items=req.max_items,
    )
    return result


@router.post("/auto-analyze")
async def auto_analyze(req: AutoAnalyzeRequest):
    """Automated analysis given exact field configuration."""
    from app.services.data_pipeline import auto_analyze_from_config
    result = await auto_analyze_from_config(req.model_dump())
    return result
