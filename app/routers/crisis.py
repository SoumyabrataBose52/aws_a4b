import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.models.crisis import CrisisEvent, ResponseStrategy
from app.models.analytics import SentimentHistory
from app.schemas.crisis import (
    CrisisCreate, CrisisUpdate, CrisisResponse, CrisisDetailResponse,
    StrategyGenerateRequest, StrategyResponse,
    SimulationRequest, SimulationResponse,
    ExecuteStrategyRequest,
    SentimentRecordRequest, SentimentResponse, SentimentSummary,
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
