import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.system import AgentLog
from app.events.bus import event_bus
from app.llm.base import BaseLLMProvider, get_llm_provider

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all AI agents. Handles logging, LLM access, and event publishing."""

    agent_name: str = "base"

    def __init__(self, db: Session):
        self.db = db
        self.llm: BaseLLMProvider = get_llm_provider()

    def log_action(self, action: str, creator_id: str | None = None, details: dict | None = None, confidence_score: float | None = None):
        """Log an agent action to the database (Property 1: Agent action logging completeness)."""
        log_entry = AgentLog(
            id=str(uuid.uuid4()),
            agent_name=self.agent_name,
            action=action,
            creator_id=creator_id,
            details=details,
            confidence_score=confidence_score,
            timestamp=datetime.utcnow(),
        )
        self.db.add(log_entry)
        self.db.commit()
        logger.info(f"[{self.agent_name}] {action} (creator: {creator_id}, confidence: {confidence_score})")

    async def publish_event(self, event_type: str, payload: dict):
        """Publish an event to the message bus."""
        await event_bus.publish(event_type, payload, source_agent=self.agent_name)
