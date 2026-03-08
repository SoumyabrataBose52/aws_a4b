import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.models.content import Content, Performance
from app.schemas.content import (
    ContentCreate, ContentUpdate, ContentResponse, ContentScheduleRequest,
    ContentGenerateRequest, GeneratedContentResponse,
    PerformanceCreate, PerformanceResponse,
)
from app.agents.content_agent import ContentAgent
from app.events.bus import event_bus

router = APIRouter(prefix="/api/v1/content", tags=["Content"], dependencies=[Depends(verify_api_key)])


@router.post("/generate", response_model=GeneratedContentResponse)
async def generate_content(data: ContentGenerateRequest, db: Session = Depends(get_db)):
    """Generate content using AI Content Agent with Creator DNA."""
    try:
        agent = ContentAgent(db)
        content = await agent.generate_content(
            creator_id=data.creator_id,
            platforms=data.platforms,
            topic=data.topic,
            trend_id=data.trend_id,
            language=data.language,
        )
        return GeneratedContentResponse(
            content=content,
            style_match_score=content.confidence_score or 0.5,
            performance_prediction=content.performance_prediction,
        )
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print("GENERATE_ERROR:", trace)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=ContentResponse, status_code=201)
def create_content(data: ContentCreate, db: Session = Depends(get_db)):
    """Manually create content."""
    content = Content(id=str(uuid.uuid4()), **data.model_dump())
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


@router.get("", response_model=list[ContentResponse])
def list_content(
    creator_id: str | None = None,
    status: str | None = None,
    generated_by: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Content)
    if creator_id:
        query = query.filter(Content.creator_id == creator_id)
    if status:
        query = query.filter(Content.status == status)
    if generated_by:
        query = query.filter(Content.generated_by == generated_by)
    return query.order_by(Content.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{content_id}", response_model=ContentResponse)
def get_content(content_id: str, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content


@router.put("/{content_id}", response_model=ContentResponse)
def update_content(content_id: str, data: ContentUpdate, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(content, key, val)
    db.commit()
    db.refresh(content)
    return content


@router.delete("/{content_id}", status_code=204)
def delete_content(content_id: str, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    db.delete(content)
    db.commit()


@router.post("/{content_id}/schedule", response_model=ContentResponse)
def schedule_content(content_id: str, data: ContentScheduleRequest, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    content.status = "scheduled"
    content.scheduled_time = data.scheduled_time
    db.commit()
    db.refresh(content)
    return content


@router.post("/{content_id}/publish", response_model=ContentResponse)
def publish_content(content_id: str, db: Session = Depends(get_db)):
    """Mock publish — marks content as published."""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    content.status = "published"
    content.published_time = datetime.utcnow()
    db.commit()
    db.refresh(content)
    return content


@router.get("/{content_id}/performance", response_model=PerformanceResponse)
def get_performance(content_id: str, db: Session = Depends(get_db)):
    perf = db.query(Performance).filter(Performance.content_id == content_id).first()
    if not perf:
        raise HTTPException(status_code=404, detail="No performance data for this content")
    return perf


@router.post("/{content_id}/performance", response_model=PerformanceResponse, status_code=201)
async def record_performance(content_id: str, data: PerformanceCreate, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    existing = db.query(Performance).filter(Performance.content_id == content_id).first()
    if existing:
        for key, val in data.model_dump().items():
            setattr(existing, key, val)
        existing.measured_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        await event_bus.publish("performance_recorded", {"content_id": content_id}, "content_agent")
        return existing

    perf = Performance(id=str(uuid.uuid4()), content_id=content_id, **data.model_dump())
    db.add(perf)
    db.commit()
    db.refresh(perf)
    await event_bus.publish("performance_recorded", {"content_id": content_id}, "content_agent")
    return perf
