import json
import random
from typing import Optional
from app.llm.base import BaseLLMProvider


class MockLLMProvider(BaseLLMProvider):
    """Mock LLM provider for testing without API keys."""

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        prompt_lower = prompt.lower()

        if "content" in prompt_lower and "generate" in prompt_lower:
            return "🔥 Just dropped something amazing! The journey continues and I couldn't be more excited to share this with you all. What do you think? Drop your thoughts below! 👇 #ContentCreator #Viral #NewContent"

        if "crisis" in prompt_lower or "response" in prompt_lower:
            return "We hear your concerns and take this feedback seriously. We're looking into this matter and will share an update shortly. Your voice matters to us. 🙏"

        if "outreach" in prompt_lower or "email" in prompt_lower:
            return (
                "Subject: Collaboration Opportunity\n\n"
                "Hi [Brand Team],\n\n"
                "I've been following your brand's journey and I believe there's a great synergy between your values and my audience. "
                "I'd love to explore a potential collaboration.\n\n"
                "My recent content has been generating strong engagement, and I think we could create something truly impactful together.\n\n"
                "Looking forward to hearing from you!\n\nBest regards"
            )

        if "counter" in prompt_lower or "negotiat" in prompt_lower:
            return "Based on my engagement rates and audience demographics, I believe a fair rate would be in the higher range. I'm open to discussing a package that works for both sides."

        return f"[Mock LLM Response] Generated response for prompt: {prompt[:100]}..."

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ) -> dict:
        prompt_lower = prompt.lower()

        if "performance" in prompt_lower or "predict" in prompt_lower:
            return {
                "score": round(random.uniform(40, 90), 1),
                "expected_likes": random.randint(100, 5000),
                "expected_comments": random.randint(10, 500),
                "expected_shares": random.randint(5, 200),
                "confidence_interval": [0.6, 0.85],
                "factors": [
                    {"name": "topic_relevance", "impact": round(random.uniform(0.3, 0.9), 2), "explanation": "Topic aligns well with audience interests"},
                    {"name": "posting_time", "impact": round(random.uniform(0.1, 0.6), 2), "explanation": "Optimal posting window"},
                    {"name": "hashtag_effectiveness", "impact": round(random.uniform(0.2, 0.7), 2), "explanation": "Strong hashtag strategy"},
                ],
            }

        if "research" in prompt_lower or "rate" in prompt_lower:
            return {
                "suggested_rates": {
                    "percentile25": random.randint(5000, 15000),
                    "percentile50": random.randint(15000, 40000),
                    "percentile75": random.randint(40000, 100000),
                },
                "comparable_creators": ["Creator A", "Creator B", "Creator C"],
                "brand_industry": "Technology",
                "typical_requirements": ["1 Instagram Post", "2 Stories", "1 Reel"],
                "negotiation_tips": [
                    "Highlight your engagement rate over follower count",
                    "Offer a package deal for multiple platforms",
                    "Include exclusivity premium if applicable",
                ],
            }

        if "strategy" in prompt_lower or "crisis" in prompt_lower:
            strategies = ["acknowledge", "apologize", "clarify"]
            return {
                "strategies": [
                    {
                        "type": s,
                        "response_text": f"[{s.title()}] We take this seriously and are committed to addressing your concerns.",
                        "predicted_sentiment_change": round(random.uniform(0.1, 0.4), 2),
                        "risk_level": random.choice(["low", "medium"]),
                        "historical_similarity": round(random.uniform(0.5, 0.9), 2),
                    }
                    for s in strategies
                ]
            }

        if "forecast" in prompt_lower:
            return {
                "projected_follower_growth": round(random.uniform(1.5, 8.0), 1),
                "projected_engagement_rate": round(random.uniform(2.0, 6.0), 1),
                "confidence_level": round(random.uniform(0.6, 0.85), 2),
                "underperforming_categories": ["Product Reviews", "Behind-the-scenes"],
                "suggested_pivots": ["Increase short-form video content", "Collaborate with niche creators"],
            }

        if "dna" in prompt_lower or "analyze" in prompt_lower:
            return {
                "linguistics": {
                    "average_sentence_length": round(random.uniform(10, 25), 1),
                    "sentence_length_variance": round(random.uniform(3, 8), 1),
                    "vocabulary_preferences": {"love": 0.8, "amazing": 0.7, "check out": 0.6},
                    "punctuation_style": {"exclamation_frequency": 0.4, "question_frequency": 0.2},
                },
                "style": {
                    "humor_type": random.choice(["sarcastic", "wholesome", "observational"]),
                    "tone": random.choice(["casual", "friendly", "professional"]),
                    "formality_level": round(random.uniform(2, 7), 1),
                    "emoji_usage": {"frequency": round(random.uniform(1, 5), 1), "preferred_emojis": {"🔥": 0.3, "❤️": 0.25, "😂": 0.2}},
                },
                "content_patterns": {
                    "posting_cadence": random.choice(["daily", "3x_week", "weekly"]),
                    "topic_distribution": {"lifestyle": 0.3, "tech": 0.25, "travel": 0.2, "food": 0.15},
                    "hashtag_strategy": {"average_count": random.randint(5, 15), "placement": "end"},
                },
            }

        return {"message": "Mock JSON response", "status": "ok"}
