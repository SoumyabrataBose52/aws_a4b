import logging
from app.events.bus import event_bus

logger = logging.getLogger(__name__)


async def on_content_generated(event: dict):
    """When content is generated, Analytics Agent could predict performance."""
    logger.info(f"[Analytics] Content generated — would trigger performance prediction: {event['payload'].get('content_id')}")


async def on_crisis_detected(event: dict):
    """When a crisis is detected, notify and trigger strategy generation."""
    logger.info(f"[Notification] Crisis detected for creator {event['payload'].get('creator_id')} — threat: {event['payload'].get('threat_level')}")


async def on_trend_detected(event: dict):
    """When a trend is detected, suggest creators and generate content."""
    logger.info(f"[Content] Trend detected: {event['payload'].get('topic')} — would trigger content generation")


async def on_deal_created(event: dict):
    """When a deal is created, trigger research."""
    logger.info(f"[Deal] New deal created for brand {event['payload'].get('brand_name')} — would trigger research")


async def on_performance_recorded(event: dict):
    """When performance is recorded, update prediction models."""
    logger.info(f"[Analytics] Performance recorded for content {event['payload'].get('content_id')} — would update models")


def register_event_handlers():
    """Register all event handlers. Called on app startup."""
    event_bus.subscribe("content_generated", on_content_generated)
    event_bus.subscribe("crisis_detected", on_crisis_detected)
    event_bus.subscribe("trend_detected", on_trend_detected)
    event_bus.subscribe("deal_created", on_deal_created)
    event_bus.subscribe("performance_recorded", on_performance_recorded)
    logger.info("All event handlers registered")
