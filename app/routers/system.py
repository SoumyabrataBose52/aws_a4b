from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.models.system import AgentLog, Event
from app.events.bus import event_bus
from datetime import datetime

router = APIRouter(prefix="/api/v1/system", tags=["System"])


@router.get("/health")
def health_check():
    """Health check endpoint — no auth required."""
    return {
        "status": "healthy",
        "service": "nexus-solo",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/events", dependencies=[Depends(verify_api_key)])
def get_events(limit: int = Query(50, ge=1, le=200)):
    """Get recent events from the message bus."""
    return event_bus.get_history(limit)


@router.get("/logs", dependencies=[Depends(verify_api_key)])
def get_agent_logs(
    agent_name: str | None = None,
    creator_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get agent action logs (Property 1)."""
    query = db.query(AgentLog)
    if agent_name:
        query = query.filter(AgentLog.agent_name == agent_name)
    if creator_id:
        query = query.filter(AgentLog.creator_id == creator_id)
    return query.order_by(AgentLog.timestamp.desc()).offset(skip).limit(limit).all()
