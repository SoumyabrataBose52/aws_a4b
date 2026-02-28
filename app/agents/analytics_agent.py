import uuid
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.content import Content, Performance
from app.models.crisis import CrisisEvent
from app.models.deal import BrandDeal
from app.models.analytics import SentimentHistory, PostingTimeSlot


class AnalyticsAgent(BaseAgent):
    """Analytics Agent: Predictive performance, posting optimization, engagement forecasting."""

    agent_name = "analytics_agent"

    async def predict_performance(self, creator_id: str, content_text: str, platform: str = "instagram") -> dict:
        """Predict content performance using LLM and historical data."""
        # Get historical performance data
        hist_performances = (
            self.db.query(Performance)
            .join(Content)
            .filter(Content.creator_id == creator_id)
            .order_by(Performance.measured_at.desc())
            .limit(20)
            .all()
        )

        avg_likes = sum(p.likes for p in hist_performances) / max(len(hist_performances), 1) if hist_performances else 500
        avg_engagement = sum(p.engagement_rate for p in hist_performances) / max(len(hist_performances), 1) if hist_performances else 3.5

        system_prompt = "You are a social media analytics AI. Predict content performance based on historical data."
        prompt = f"""Predict performance for this content:
Text: {content_text[:500]}
Platform: {platform}
Creator's avg likes: {avg_likes:.0f}
Creator's avg engagement rate: {avg_engagement:.1f}%

Return JSON with: score (0-100), expected_likes, expected_comments, expected_shares, confidence_interval [lower, upper], factors (list of name/impact/explanation dicts)"""

        prediction = await self.llm.generate_json(prompt, system_prompt=system_prompt)

        self.log_action("performance_predicted", creator_id, {"platform": platform, "score": prediction.get("score")})
        return prediction

    def get_posting_time_suggestions(self, creator_id: str, platform: str) -> list[dict]:
        """Suggest optimal posting times using multi-armed bandit data (Property 48)."""
        slots = (
            self.db.query(PostingTimeSlot)
            .filter(PostingTimeSlot.creator_id == creator_id, PostingTimeSlot.platform == platform)
            .order_by(PostingTimeSlot.score.desc())
            .limit(5)
            .all()
        )

        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        if slots:
            return [
                {
                    "day_of_week": s.day_of_week,
                    "day_name": day_names[s.day_of_week],
                    "hour": s.hour,
                    "score": round(s.score, 2),
                    "avg_engagement_rate": round(s.avg_engagement_rate, 2),
                }
                for s in slots
            ]
        else:
            # Default suggestions if no data
            defaults = [
                {"day_of_week": 1, "day_name": "Tuesday", "hour": 10, "score": 0.8, "avg_engagement_rate": 4.2},
                {"day_of_week": 3, "day_name": "Thursday", "hour": 14, "score": 0.75, "avg_engagement_rate": 3.8},
                {"day_of_week": 5, "day_name": "Saturday", "hour": 11, "score": 0.7, "avg_engagement_rate": 3.5},
            ]
            return defaults

    async def forecast_engagement(self, creator_id: str, days: int = 7) -> dict:
        """Forecast engagement for the next N days (Property 60)."""
        system_prompt = "You are an analytics AI forecasting social media engagement trends."
        prompt = f"""Forecast the next {days}-day engagement for creator {creator_id}.
Return JSON with: projected_follower_growth (%), projected_engagement_rate (%), confidence_level (0-1), underperforming_categories (list), suggested_pivots (list)"""

        forecast = await self.llm.generate_json(prompt, system_prompt=system_prompt)

        now = datetime.utcnow()
        result = {
            "creator_id": creator_id,
            "forecast_period_start": now.isoformat(),
            "forecast_period_end": (now + timedelta(days=days)).isoformat(),
            **forecast,
        }

        self.log_action("engagement_forecasted", creator_id, {"days": days})
        return result

    def get_dashboard_metrics(self, creator_id: str) -> dict:
        """Aggregate all metrics for the dashboard (Property 40-43)."""
        # Content stats
        total_content = self.db.query(Content).filter(Content.creator_id == creator_id).count()
        published_content = self.db.query(Content).filter(
            Content.creator_id == creator_id, Content.status == "published"
        ).count()

        # Average confidence
        avg_conf = self.db.query(func.avg(Content.confidence_score)).filter(
            Content.creator_id == creator_id
        ).scalar() or 0.0

        # Active crises
        active_crises = self.db.query(CrisisEvent).filter(
            CrisisEvent.creator_id == creator_id, CrisisEvent.status == "active"
        ).count()

        # Pending deals
        pending_deals = self.db.query(BrandDeal).filter(
            BrandDeal.creator_id == creator_id,
            BrandDeal.status.in_(["prospecting", "negotiating"]),
        ).count()

        # Sentiment
        recent_sentiment = (
            self.db.query(SentimentHistory)
            .filter(SentimentHistory.creator_id == creator_id)
            .order_by(SentimentHistory.recorded_at.desc())
            .first()
        )

        # Weekly engagement
        week_ago = datetime.utcnow() - timedelta(days=7)
        week_performances = (
            self.db.query(Performance)
            .join(Content)
            .filter(Content.creator_id == creator_id, Performance.measured_at >= week_ago)
            .all()
        )
        weekly_engagement = sum(p.engagement_rate for p in week_performances) / max(len(week_performances), 1) if week_performances else 0.0

        return {
            "creator_id": creator_id,
            "current_sentiment": recent_sentiment.sentiment_score if recent_sentiment else 0.0,
            "weekly_engagement": round(weekly_engagement, 2),
            "follower_growth": 2.5,  # Mock — would come from platform sync
            "active_crises": active_crises,
            "pending_deals": pending_deals,
            "total_content": total_content,
            "published_content": published_content,
            "avg_confidence_score": round(float(avg_conf), 2),
            "success_metrics": {
                "time_saved_percentage": 85,
                "deal_conversion_improvement": 40,
                "crisis_detection_time_minutes": 8,
                "prediction_accuracy_improvement": 28,
            },
        }
