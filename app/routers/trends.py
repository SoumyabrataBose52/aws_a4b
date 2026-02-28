import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.models.trend import TrendAlert
from app.schemas.trend import TrendCreate, TrendUpdate, TrendResponse, CreatorMatchResponse
from app.agents.trend_agent import TrendAgent
from app.agents.content_agent import ContentAgent
from app.schemas.content import GeneratedContentResponse

router = APIRouter(prefix="/api/v1/trends", tags=["Trends"], dependencies=[Depends(verify_api_key)])


@router.post("", response_model=TrendResponse, status_code=201)
async def create_trend(data: TrendCreate, db: Session = Depends(get_db)):
    agent = TrendAgent(db)
    trend = await agent.create_trend(data.model_dump())
    return trend


@router.get("", response_model=list[TrendResponse])
def list_trends(
    status: str | None = None,
    urgency_level: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(TrendAlert)
    if status:
        query = query.filter(TrendAlert.status == status)
    if urgency_level:
        query = query.filter(TrendAlert.urgency_level == urgency_level)
    return query.order_by(TrendAlert.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{trend_id}", response_model=TrendResponse)
def get_trend(trend_id: str, db: Session = Depends(get_db)):
    trend = db.query(TrendAlert).filter(TrendAlert.id == trend_id).first()
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    return trend


@router.put("/{trend_id}", response_model=TrendResponse)
def update_trend(trend_id: str, data: TrendUpdate, db: Session = Depends(get_db)):
    trend = db.query(TrendAlert).filter(TrendAlert.id == trend_id).first()
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(trend, key, val)
    db.commit()
    db.refresh(trend)
    return trend


@router.post("/{trend_id}/match", response_model=list[CreatorMatchResponse])
async def match_creators_to_trend(trend_id: str, creator_ids: list[str] | None = None, db: Session = Depends(get_db)):
    """Match creators to this trend based on DNA compatibility."""
    agent = TrendAgent(db)
    matches = await agent.match_creators(trend_id, creator_ids)
    return matches


@router.post("/{trend_id}/generate", response_model=GeneratedContentResponse)
async def generate_trend_content(
    trend_id: str,
    creator_id: str,
    platforms: list[str] = ["instagram"],
    db: Session = Depends(get_db),
):
    """Generate content for a specific trend and creator."""
    trend = db.query(TrendAlert).filter(TrendAlert.id == trend_id).first()
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")

    agent = ContentAgent(db)
    content = await agent.generate_content(
        creator_id=creator_id,
        platforms=platforms,
        topic=trend.topic,
        trend_id=trend_id,
    )
    return GeneratedContentResponse(
        content=content,
        style_match_score=content.confidence_score or 0.5,
        performance_prediction=content.performance_prediction,
    )
