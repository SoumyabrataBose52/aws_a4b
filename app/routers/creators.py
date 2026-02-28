import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.models.creator import Creator, CreatorDNA
from app.models.platform import PlatformConnection
from app.schemas.creator import (
    CreatorCreate, CreatorUpdate, CreatorResponse, CreatorDetailResponse,
    CreatorDNAUpdate, CreatorDNAResponse,
)
from app.schemas.platform import PlatformConnectRequest, PlatformConnectionResponse
from app.llm.base import get_llm_provider

router = APIRouter(prefix="/api/v1/creators", tags=["Creators"], dependencies=[Depends(verify_api_key)])


@router.post("", response_model=CreatorResponse, status_code=201)
def create_creator(data: CreatorCreate, db: Session = Depends(get_db)):
    creator = Creator(id=str(uuid.uuid4()), **data.model_dump())
    db.add(creator)
    db.commit()
    db.refresh(creator)
    return creator


@router.get("", response_model=list[CreatorResponse])
def list_creators(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Creator)
    if status:
        query = query.filter(Creator.status == status)
    return query.offset(skip).limit(limit).all()


@router.get("/{creator_id}", response_model=CreatorDetailResponse)
def get_creator(creator_id: str, db: Session = Depends(get_db)):
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return creator


@router.put("/{creator_id}", response_model=CreatorResponse)
def update_creator(creator_id: str, data: CreatorUpdate, db: Session = Depends(get_db)):
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(creator, key, val)
    db.commit()
    db.refresh(creator)
    return creator


@router.delete("/{creator_id}", status_code=204)
def delete_creator(creator_id: str, db: Session = Depends(get_db)):
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    db.delete(creator)
    db.commit()


@router.post("/{creator_id}/onboard", response_model=CreatorDNAResponse)
async def onboard_creator(creator_id: str, db: Session = Depends(get_db)):
    """Trigger creator onboarding: analyze posts and build DNA profile."""
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    existing_dna = db.query(CreatorDNA).filter(CreatorDNA.creator_id == creator_id).first()
    if existing_dna:
        raise HTTPException(status_code=409, detail="Creator DNA already exists. Use PUT to update.")

    # Use LLM to generate DNA profile from mock post analysis
    llm = get_llm_provider()
    prompt = f"Analyze the content style of creator '{creator.name}' and generate a DNA profile. Include linguistics, style, and content_patterns."
    dna_data = await llm.generate_json(prompt)

    dna = CreatorDNA(
        id=str(uuid.uuid4()),
        creator_id=creator_id,
        version=1,
        linguistics=dna_data.get("linguistics"),
        style=dna_data.get("style"),
        content_patterns=dna_data.get("content_patterns"),
        analyzed_posts=50,
        confidence_score=0.75,
    )
    db.add(dna)
    creator.status = "active"
    db.commit()
    db.refresh(dna)
    return dna


@router.get("/{creator_id}/dna", response_model=CreatorDNAResponse)
def get_dna(creator_id: str, db: Session = Depends(get_db)):
    dna = db.query(CreatorDNA).filter(CreatorDNA.creator_id == creator_id).first()
    if not dna:
        raise HTTPException(status_code=404, detail="Creator DNA not found. Run onboarding first.")
    return dna


@router.put("/{creator_id}/dna", response_model=CreatorDNAResponse)
def update_dna(creator_id: str, data: CreatorDNAUpdate, db: Session = Depends(get_db)):
    dna = db.query(CreatorDNA).filter(CreatorDNA.creator_id == creator_id).first()
    if not dna:
        raise HTTPException(status_code=404, detail="Creator DNA not found.")
    for key, val in data.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(dna, key, val.model_dump() if hasattr(val, 'model_dump') else val)
    dna.version += 1
    db.commit()
    db.refresh(dna)
    return dna


# --- Platform Connections ---

@router.post("/{creator_id}/platforms", response_model=PlatformConnectionResponse, status_code=201)
def connect_platform(creator_id: str, data: PlatformConnectRequest, db: Session = Depends(get_db)):
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    conn = PlatformConnection(
        id=str(uuid.uuid4()),
        creator_id=creator_id,
        platform=data.platform,
        access_token=data.access_token,
        refresh_token=data.refresh_token,
        permissions=data.permissions,
        status="connected",
        last_sync_at=datetime.utcnow(),
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.get("/{creator_id}/platforms", response_model=list[PlatformConnectionResponse])
def list_platforms(creator_id: str, db: Session = Depends(get_db)):
    return db.query(PlatformConnection).filter(PlatformConnection.creator_id == creator_id).all()
