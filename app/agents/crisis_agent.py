import uuid
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.crisis import CrisisEvent, ResponseStrategy
from app.models.analytics import SentimentHistory


class CrisisAgent(BaseAgent):
    """Crisis Agent: Monitors sentiment, detects crises, generates response strategies."""

    agent_name = "crisis_agent"

    async def generate_strategies(self, crisis_id: str, count: int = 3) -> list[ResponseStrategy]:
        """Generate response strategies for a crisis event using LLM."""
        crisis = self.db.query(CrisisEvent).filter(CrisisEvent.id == crisis_id).first()
        if not crisis:
            raise ValueError(f"Crisis {crisis_id} not found")

        system_prompt = """You are a PR crisis management AI. Generate response strategies for social media crises.
Each strategy should have a different approach (acknowledge, apologize, clarify, ignore, legal).
Provide realistic predictions for sentiment recovery."""

        prompt = f"""Crisis Details:
- Threat Level: {crisis.threat_level}
- Sentiment Drop: {crisis.sentiment_drop}
- Affected Platforms: {crisis.affected_platforms}
- Triggering Messages: {crisis.triggering_messages}

Generate {count} distinct response strategies as JSON with this structure:
{{
  "strategies": [
    {{
      "type": "acknowledge|apologize|clarify|ignore|legal",
      "response_text": "the actual response text",
      "predicted_sentiment_change": 0.1 to 0.5,
      "risk_level": "low|medium|high",
      "historical_similarity": 0.0 to 1.0
    }}
  ]
}}"""

        result = await self.llm.generate_json(prompt, system_prompt=system_prompt)

        strategies = []
        for s in result.get("strategies", [])[:count]:
            strategy = ResponseStrategy(
                id=str(uuid.uuid4()),
                crisis_id=crisis_id,
                type=s.get("type", "acknowledge"),
                response_text=s.get("response_text", ""),
                target_platforms=crisis.affected_platforms,
                predicted_sentiment_change=s.get("predicted_sentiment_change", 0.2),
                confidence_interval={"lower": 0.05, "upper": 0.4},
                risk_level=s.get("risk_level", "medium"),
                historical_similarity=s.get("historical_similarity", 0.6),
            )
            self.db.add(strategy)
            strategies.append(strategy)

        self.db.commit()
        for s in strategies:
            self.db.refresh(s)

        self.log_action("strategies_generated", crisis.creator_id, {"crisis_id": crisis_id, "count": len(strategies)})
        return strategies

    async def simulate_outcome(self, strategy_id: str) -> dict:
        """Simulate the outcome of a response strategy."""
        strategy = self.db.query(ResponseStrategy).filter(ResponseStrategy.id == strategy_id).first()
        if not strategy:
            raise ValueError(f"Strategy {strategy_id} not found")

        # Simulation based on strategy type
        type_modifiers = {
            "acknowledge": {"sentiment": 0.2, "risk": "medium", "recovery_hours": 48},
            "apologize": {"sentiment": 0.35, "risk": "low", "recovery_hours": 24},
            "clarify": {"sentiment": 0.25, "risk": "medium", "recovery_hours": 36},
            "ignore": {"sentiment": 0.05, "risk": "high", "recovery_hours": 72},
            "legal": {"sentiment": 0.15, "risk": "high", "recovery_hours": 96},
        }

        modifier = type_modifiers.get(strategy.type, type_modifiers["acknowledge"])

        self.log_action("outcome_simulated", details={"strategy_id": strategy_id})
        return {
            "strategy_id": strategy_id,
            "predicted_sentiment_change": modifier["sentiment"],
            "confidence_interval": [modifier["sentiment"] * 0.5, modifier["sentiment"] * 1.5],
            "risk_level": modifier["risk"],
            "historical_similarity": strategy.historical_similarity,
            "estimated_recovery_hours": modifier["recovery_hours"],
        }

    async def execute_strategy(self, crisis_id: str, strategy_id: str) -> ResponseStrategy:
        """Mark a strategy as executed."""
        strategy = self.db.query(ResponseStrategy).filter(
            ResponseStrategy.id == strategy_id,
            ResponseStrategy.crisis_id == crisis_id,
        ).first()

        if not strategy:
            raise ValueError(f"Strategy {strategy_id} not found for crisis {crisis_id}")

        strategy.selected = True
        strategy.executed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(strategy)

        self.log_action("strategy_executed", details={"crisis_id": crisis_id, "strategy_id": strategy_id, "type": strategy.type})
        return strategy

    def get_sentiment_summary(self, creator_id: str) -> dict:
        """Get 7-day sentiment summary for a creator (Property 30)."""
        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        records = (
            self.db.query(SentimentHistory)
            .filter(SentimentHistory.creator_id == creator_id, SentimentHistory.recorded_at >= seven_days_ago)
            .order_by(SentimentHistory.recorded_at.desc())
            .all()
        )

        if not records:
            return {
                "creator_id": creator_id,
                "current_score": 0.0,
                "average_7d": 0.0,
                "trend": "stable",
                "anomaly_detected": False,
                "data_points": 0,
            }

        scores = [r.sentiment_score for r in records]
        current = scores[0]
        avg = sum(scores) / len(scores)

        # Trend detection
        if len(scores) >= 2:
            recent_avg = sum(scores[:len(scores)//2]) / (len(scores)//2)
            older_avg = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
            diff = recent_avg - older_avg
            trend = "rising" if diff > 0.05 else "falling" if diff < -0.05 else "stable"
        else:
            trend = "stable"

        # Anomaly detection (Property 31: >0.3 drop in 1 hour)
        anomaly = False
        if len(scores) >= 2:
            max_drop = max(scores[i+1] - scores[i] for i in range(len(scores)-1) if scores[i+1] - scores[i] < 0)
            anomaly = abs(max_drop) > 0.3 if max_drop else False

        return {
            "creator_id": creator_id,
            "current_score": round(current, 3),
            "average_7d": round(avg, 3),
            "trend": trend,
            "anomaly_detected": anomaly,
            "data_points": len(records),
        }
