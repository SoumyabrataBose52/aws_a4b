import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.trend import TrendAlert
from app.models.creator import Creator, CreatorDNA


class TrendAgent(BaseAgent):
    """Trend Agent: Monitors trends and matches creators to opportunities."""

    agent_name = "trend_agent"

    async def match_creators(self, trend_id: str, creator_ids: list[str] | None = None) -> list[dict]:
        """Match creators to a trend based on DNA compatibility."""
        trend = self.db.query(TrendAlert).filter(TrendAlert.id == trend_id).first()
        if not trend:
            raise ValueError(f"Trend {trend_id} not found")

        # Get creators to evaluate
        if creator_ids:
            creators = self.db.query(Creator).filter(Creator.id.in_(creator_ids)).all()
        else:
            creators = self.db.query(Creator).filter(Creator.status == "active").all()

        matches = []
        for creator in creators:
            dna = self.db.query(CreatorDNA).filter(CreatorDNA.creator_id == creator.id).first()

            # Calculate alignment score based on topic distribution
            alignment_score = 0.5  # default
            audience_overlap = 0.3  # default
            reasoning = "General topic alignment"

            if dna and dna.content_patterns:
                topics = dna.content_patterns.get("topic_distribution", {})
                trend_topic_lower = trend.topic.lower()
                for topic, weight in topics.items():
                    if topic.lower() in trend_topic_lower or trend_topic_lower in topic.lower():
                        alignment_score = min(0.5 + weight, 1.0)
                        reasoning = f"Strong match: creator regularly posts about {topic} ({weight*100:.0f}% of content)"
                        break
                audience_overlap = min(alignment_score * 0.8, 0.9)

            matches.append({
                "creator_id": creator.id,
                "creator_name": creator.name,
                "alignment_score": round(alignment_score, 2),
                "audience_overlap": round(audience_overlap, 2),
                "reasoning": reasoning,
            })

        # Sort by alignment score
        matches.sort(key=lambda x: x["alignment_score"], reverse=True)

        self.log_action("creators_matched_to_trend", details={"trend_id": trend_id, "matches": len(matches)})
        return matches

    async def create_trend(self, trend_data: dict) -> TrendAlert:
        """Create a new trend alert and publish event."""
        trend = TrendAlert(id=str(uuid.uuid4()), **trend_data)
        self.db.add(trend)
        self.db.commit()
        self.db.refresh(trend)

        self.log_action("trend_created", details={"trend_id": trend.id, "topic": trend.topic})
        await self.publish_event("trend_detected", {"trend_id": trend.id, "topic": trend.topic, "urgency": trend.urgency_level})

        return trend
