import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.creator import Creator, CreatorDNA
from app.models.content import Content
from app.models.platform import PlatformConnection


PLATFORM_LIMITS = {
    "instagram": {"max_chars": 2200, "max_hashtags": 30},
    "youtube": {"max_chars": 5000, "max_hashtags": 15},
    "tiktok": {"max_chars": 4000, "max_hashtags": 20},
    "x": {"max_chars": 280, "max_hashtags": 5},
    "linkedin": {"max_chars": 3000, "max_hashtags": 10},
    "facebook": {"max_chars": 63206, "max_hashtags": 10},
    "sharechat": {"max_chars": 2000, "max_hashtags": 15},
    "moj": {"max_chars": 1500, "max_hashtags": 10},
    "josh": {"max_chars": 1500, "max_hashtags": 10},
    "chingari": {"max_chars": 1500, "max_hashtags": 10},
}


class ContentAgent(BaseAgent):
    """Content Agent: Generates platform-specific content in each creator's authentic voice."""

    agent_name = "content_agent"

    async def generate_content(
        self,
        creator_id: str,
        platforms: list[str],
        topic: str | None = None,
        trend_id: str | None = None,
        language: str = "english",
    ) -> Content:
        """Generate content using Creator DNA and LLM."""
        creator = self.db.query(Creator).filter(Creator.id == creator_id).first()
        if not creator:
            raise ValueError(f"Creator {creator_id} not found")

        # Load Creator DNA
        dna = self.db.query(CreatorDNA).filter(CreatorDNA.creator_id == creator_id).first()
        dna_context = ""
        if dna:
            dna_context = f"""
Creator Voice Profile:
- Tone: {dna.style.get('tone', 'casual') if dna.style else 'casual'}
- Humor: {dna.style.get('humor_type', 'none') if dna.style else 'none'}
- Formality: {dna.style.get('formality_level', 5) if dna.style else 5}/10
- Avg sentence length: {dna.linguistics.get('average_sentence_length', 15) if dna.linguistics else 15} words
- Emoji usage: {'moderate' if dna.style and dna.style.get('emoji_usage', {}).get('frequency', 2) > 2 else 'light'}
"""

        # Build platform-specific instructions
        platform_str = ", ".join(platforms)
        limits = [f"{p}: max {PLATFORM_LIMITS.get(p, {}).get('max_chars', 2000)} chars" for p in platforms]
        limits_str = "\n".join(limits)

        system_prompt = f"""You are a content generation AI for social media creators.
Generate content that matches the creator's authentic voice.
{dna_context}
Platform limits:
{limits_str}

Creator name: {creator.name}
Target platforms: {platform_str}
Language: {language}
"""

        topic_str = f"about: {topic}" if topic else "on a topic suitable for this creator"
        prompt = f"Generate a social media post {topic_str}. Include relevant hashtags and mentions if appropriate. Make it engaging and authentic to the creator's voice."

        if trend_id:
            prompt += f"\nThis should tie into trending topic ID: {trend_id}"

        # Generate via LLM
        text = await self.llm.generate_text(prompt, system_prompt=system_prompt)

        # Score style match
        confidence = await self.score_style_match(text, dna) if dna else 0.5

        # Create content record
        content = Content(
            id=str(uuid.uuid4()),
            creator_id=creator_id,
            text=text,
            hashtags=self._extract_hashtags(text),
            platforms=platforms,
            language=language,
            generated_by="ai",
            confidence_score=confidence,
            trend_id=trend_id,
            status="draft",
        )
        self.db.add(content)
        self.db.commit()
        self.db.refresh(content)

        # Log and publish
        self.log_action("content_generated", creator_id, {"content_id": content.id, "platforms": platforms}, confidence)
        await self.publish_event("content_generated", {"content_id": content.id, "creator_id": creator_id, "platforms": platforms})

        return content

    async def score_style_match(self, text: str, dna: CreatorDNA) -> float:
        """Score how well generated content matches the creator's DNA."""
        if not dna or not dna.style:
            return 0.5

        score = 0.7  # Base score for LLM-generated content

        # Check sentence length alignment
        if dna.linguistics:
            avg_len = dna.linguistics.get("average_sentence_length", 15)
            sentences = text.split(".")
            actual_avg = sum(len(s.split()) for s in sentences if s.strip()) / max(len(sentences), 1)
            variance = abs(actual_avg - avg_len) / avg_len
            if variance < 0.2:
                score += 0.1

        # Check emoji usage alignment
        if dna.style:
            emoji_freq = dna.style.get("emoji_usage", {}).get("frequency", 2)
            emoji_count = sum(1 for c in text if ord(c) > 127000)  # rough emoji detection
            if emoji_freq > 3 and emoji_count > 0:
                score += 0.05
            elif emoji_freq < 1 and emoji_count == 0:
                score += 0.05

        return min(score, 1.0)

    def _extract_hashtags(self, text: str) -> list[str]:
        """Extract hashtags from generated text."""
        return [word for word in text.split() if word.startswith("#")]
