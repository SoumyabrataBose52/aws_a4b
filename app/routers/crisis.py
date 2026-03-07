import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.models.crisis import CrisisEvent, ResponseStrategy, CommentAnalysis
from app.models.analytics import SentimentHistory
from app.schemas.crisis import (
    CrisisCreate, CrisisUpdate, CrisisResponse, CrisisDetailResponse,
    StrategyGenerateRequest, StrategyResponse,
    SimulationRequest, SimulationResponse,
    ExecuteStrategyRequest,
    SentimentRecordRequest, SentimentResponse, SentimentSummary,
    CommentAnalyzeRequest, CommentAnalysisResponse, CommentAnalysisListItem,
)
from app.agents.crisis_agent import CrisisAgent
from app.events.bus import event_bus

router = APIRouter(prefix="/api/v1", tags=["Crisis"], dependencies=[Depends(verify_api_key)])


@router.post("/crisis", response_model=CrisisResponse, status_code=201)
async def create_crisis(data: CrisisCreate, db: Session = Depends(get_db)):
    crisis = CrisisEvent(id=str(uuid.uuid4()), **data.model_dump())
    db.add(crisis)
    db.commit()
    db.refresh(crisis)
    await event_bus.publish("crisis_detected", {
        "crisis_id": crisis.id, "creator_id": crisis.creator_id, "threat_level": crisis.threat_level,
    }, "crisis_agent")
    return crisis


@router.get("/crisis", response_model=list[CrisisResponse])
def list_crises(
    creator_id: str | None = None,
    status: str | None = None,
    threat_level: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(CrisisEvent)
    if creator_id:
        query = query.filter(CrisisEvent.creator_id == creator_id)
    if status:
        query = query.filter(CrisisEvent.status == status)
    if threat_level:
        query = query.filter(CrisisEvent.threat_level == threat_level)
    return query.order_by(CrisisEvent.detected_at.desc()).offset(skip).limit(limit).all()


@router.get("/crisis/{crisis_id}", response_model=CrisisDetailResponse)
def get_crisis(crisis_id: str, db: Session = Depends(get_db)):
    crisis = db.query(CrisisEvent).options(joinedload(CrisisEvent.strategies)).filter(CrisisEvent.id == crisis_id).first()
    if not crisis:
        raise HTTPException(status_code=404, detail="Crisis not found")
    return crisis


@router.put("/crisis/{crisis_id}", response_model=CrisisResponse)
def update_crisis(crisis_id: str, data: CrisisUpdate, db: Session = Depends(get_db)):
    crisis = db.query(CrisisEvent).filter(CrisisEvent.id == crisis_id).first()
    if not crisis:
        raise HTTPException(status_code=404, detail="Crisis not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(crisis, key, val)
    db.commit()
    db.refresh(crisis)
    return crisis


@router.post("/crisis/{crisis_id}/strategies", response_model=list[StrategyResponse])
async def generate_strategies(crisis_id: str, req: StrategyGenerateRequest | None = None, db: Session = Depends(get_db)):
    count = req.count if req else 3
    agent = CrisisAgent(db)
    strategies = await agent.generate_strategies(crisis_id, count=count)
    return strategies


@router.post("/crisis/{crisis_id}/simulate", response_model=SimulationResponse)
async def simulate_outcome(crisis_id: str, req: SimulationRequest, db: Session = Depends(get_db)):
    agent = CrisisAgent(db)
    result = await agent.simulate_outcome(req.strategy_id)
    return result


@router.post("/crisis/{crisis_id}/execute", response_model=StrategyResponse)
async def execute_strategy(crisis_id: str, req: ExecuteStrategyRequest, db: Session = Depends(get_db)):
    agent = CrisisAgent(db)
    strategy = await agent.execute_strategy(crisis_id, req.strategy_id)
    return strategy


# --- Sentiment ---

@router.post("/sentiment", response_model=SentimentResponse, status_code=201)
def record_sentiment(data: SentimentRecordRequest, db: Session = Depends(get_db)):
    record = SentimentHistory(id=str(uuid.uuid4()), **data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/sentiment/{creator_id}", response_model=SentimentSummary)
def get_sentiment_summary(creator_id: str, db: Session = Depends(get_db)):
    agent = CrisisAgent(db)
    return agent.get_sentiment_summary(creator_id)


# --- Comment Analysis ---

@router.post("/crisis/analyze-comments", response_model=CommentAnalysisResponse)
async def analyze_comments(req: CommentAnalyzeRequest, db: Session = Depends(get_db)):
    """Run full sentiment analysis on a YouTube video's comments using pretrained transformers + Gemini."""
    from app.services.comment_analyzer import analyze_video_comments
    try:
        result = await analyze_video_comments(
            video_id=req.video_id,
            db=db,
            creator_id=req.creator_id,
            interval_seconds=req.interval_seconds,
            max_comments=req.max_comments,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/crisis/analyses", response_model=list[CommentAnalysisListItem])
def list_analyses(
    video_id: str | None = None,
    creator_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List past comment analysis runs."""
    query = db.query(CommentAnalysis)
    if video_id:
        query = query.filter(CommentAnalysis.video_id == video_id)
    if creator_id:
        query = query.filter(CommentAnalysis.creator_id == creator_id)
    return query.order_by(CommentAnalysis.analyzed_at.desc()).offset(skip).limit(limit).all()


@router.get("/crisis/analyses/{analysis_id}", response_model=CommentAnalysisResponse)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    """Get a specific comment analysis by ID."""
    record = db.query(CommentAnalysis).filter(CommentAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "id": record.id,
        "video_id": record.video_id,
        "creator_id": record.creator_id,
        "total_comments": record.total_comments,
        "avg_sentiment": record.avg_sentiment,
        "sentiment_distribution": record.sentiment_distribution or {},
        "keywords": record.keywords or {},
        "alerts": record.alerts or [],
        "time_intervals": record.time_intervals or [],
        "gemini_summary": record.gemini_summary or "",
        "comments": [],
        "analyzed_at": record.analyzed_at.isoformat() if record.analyzed_at else "",
    }

