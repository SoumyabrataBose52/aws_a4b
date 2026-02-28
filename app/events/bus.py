import asyncio
import logging
from collections import defaultdict
from datetime import datetime
from typing import Callable, Any

logger = logging.getLogger(__name__)


class EventBus:
    """In-memory pub/sub event bus.
    
    Swappable to AWS SQS/SNS or EventBridge later.
    """

    def __init__(self):
        self._subscribers: dict[str, list[Callable]] = defaultdict(list)
        self._event_history: list[dict] = []

    def subscribe(self, event_type: str, handler: Callable):
        """Subscribe a handler to an event type."""
        self._subscribers[event_type].append(handler)
        logger.info(f"Subscribed handler {handler.__name__} to event '{event_type}'")

    def unsubscribe(self, event_type: str, handler: Callable):
        """Unsubscribe a handler from an event type."""
        if handler in self._subscribers[event_type]:
            self._subscribers[event_type].remove(handler)

    async def publish(self, event_type: str, payload: dict, source_agent: str = "system"):
        """Publish an event to all subscribers."""
        event = {
            "event_type": event_type,
            "source_agent": source_agent,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self._event_history.append(event)
        logger.info(f"Event published: {event_type} from {source_agent}")

        for handler in self._subscribers.get(event_type, []):
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Error in event handler {handler.__name__}: {e}")

    def get_history(self, limit: int = 50) -> list[dict]:
        """Get recent event history."""
        return self._event_history[-limit:]


# Singleton instance
event_bus = EventBus()
