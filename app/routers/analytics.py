from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.schemas.analytics import (
    PerformancePredictionRequest, PerformancePredictionResponse,
    PostingTimeSuggestion, EngagementForecast,
    DashboardMetrics, CreatorComparison,
)
from app.agents.analytics_agent import AnalyticsAgent

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"], dependencies=[Depends(verify_api_key)])


@router.post("/predict", response_model=PerformancePredictionResponse)
async def predict_performance(req: PerformancePredictionRequest, db: Session = Depends(get_db)):
    """Predict content performance before posting (Property 12)."""
    agent = AnalyticsAgent(db)
    prediction = await agent.predict_performance(
        creator_id=req.creator_id,
        content_text=req.content_text or "",
        platform=req.platform,
    )
    return prediction


@router.get("/posting-times/{creator_id}", response_model=list[PostingTimeSuggestion])
def get_posting_times(creator_id: str, platform: str = "instagram", db: Session = Depends(get_db)):
    """Suggest optimal posting times (Property 48)."""
    agent = AnalyticsAgent(db)
    return agent.get_posting_time_suggestions(creator_id, platform)


@router.get("/forecast/{creator_id}", response_model=EngagementForecast)
async def forecast_engagement(creator_id: str, days: int = Query(7, ge=1, le=30), db: Session = Depends(get_db)):
    """7-day engagement forecast (Property 60)."""
    agent = AnalyticsAgent(db)
    return await agent.forecast_engagement(creator_id, days)


@router.get("/dashboard/{creator_id}", response_model=DashboardMetrics)
def get_dashboard(creator_id: str, db: Session = Depends(get_db)):
    """Aggregated dashboard metrics (Properties 40-43)."""
    agent = AnalyticsAgent(db)
    return agent.get_dashboard_metrics(creator_id)


@router.get("/comparison", response_model=CreatorComparison)
def compare_creators(creator_ids: str = Query(..., description="Comma-separated creator IDs"), db: Session = Depends(get_db)):
    """Compare metrics across multiple creators."""
    ids = [cid.strip() for cid in creator_ids.split(",")]
    agent = AnalyticsAgent(db)
    creators_data = []
    for cid in ids:
        metrics = agent.get_dashboard_metrics(cid)
        creators_data.append(metrics)
    return {"creators": creators_data}
