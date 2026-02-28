import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.models.deal import BrandDeal, MediaKit
from app.schemas.deal import (
    DealCreate, DealUpdate, DealResponse,
    DealResearchResponse, OutreachRequest, CounterOfferResponse,
    MediaKitResponse,
)
from app.agents.deal_agent import DealAgent
from app.events.bus import event_bus

router = APIRouter(prefix="/api/v1", tags=["Deals"], dependencies=[Depends(verify_api_key)])


@router.post("/deals", response_model=DealResponse, status_code=201)
async def create_deal(data: DealCreate, db: Session = Depends(get_db)):
    deal = BrandDeal(id=str(uuid.uuid4()), **data.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    await event_bus.publish("deal_created", {"deal_id": deal.id, "brand_name": deal.brand_name, "creator_id": deal.creator_id}, "deal_agent")
    return deal


@router.get("/deals", response_model=list[DealResponse])
def list_deals(
    creator_id: str | None = None,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(BrandDeal)
    if creator_id:
        query = query.filter(BrandDeal.creator_id == creator_id)
    if status:
        query = query.filter(BrandDeal.status == status)
    return query.order_by(BrandDeal.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/deals/{deal_id}", response_model=DealResponse)
def get_deal(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(BrandDeal).filter(BrandDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.put("/deals/{deal_id}", response_model=DealResponse)
def update_deal(deal_id: str, data: DealUpdate, db: Session = Depends(get_db)):
    deal = db.query(BrandDeal).filter(BrandDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(deal, key, val)
    db.commit()
    db.refresh(deal)
    return deal


@router.post("/deals/{deal_id}/research", response_model=DealResearchResponse)
async def research_brand(deal_id: str, db: Session = Depends(get_db)):
    agent = DealAgent(db)
    result = await agent.research_brand(deal_id)
    return result


@router.post("/deals/{deal_id}/outreach")
async def generate_outreach(deal_id: str, req: OutreachRequest | None = None, db: Session = Depends(get_db)):
    tone = req.tone if req else "formal"
    agent = DealAgent(db)
    email = await agent.generate_outreach(deal_id, tone=tone)
    return {"deal_id": deal_id, "outreach_email": email}


@router.post("/deals/{deal_id}/counter", response_model=CounterOfferResponse)
async def suggest_counter_offer(deal_id: str, db: Session = Depends(get_db)):
    agent = DealAgent(db)
    result = await agent.suggest_counter_offer(deal_id)
    return result


# --- Media Kit ---

@router.post("/creators/{creator_id}/media-kit", response_model=MediaKitResponse, status_code=201)
async def generate_media_kit(creator_id: str, db: Session = Depends(get_db)):
    agent = DealAgent(db)
    kit = await agent.generate_media_kit(creator_id)
    return kit


@router.get("/creators/{creator_id}/media-kit", response_model=MediaKitResponse)
def get_media_kit(creator_id: str, db: Session = Depends(get_db)):
    kit = db.query(MediaKit).filter(MediaKit.creator_id == creator_id).first()
    if not kit:
        raise HTTPException(status_code=404, detail="Media kit not found. Generate one first.")
    return kit
