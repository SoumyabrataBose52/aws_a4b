import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.deal import BrandDeal, MediaKit
from app.models.creator import Creator, CreatorDNA
from app.models.content import Content, Performance


class DealAgent(BaseAgent):
    """Deal Agent: Handles brand partnerships, media kits, and negotiation."""

    agent_name = "deal_agent"

    async def research_brand(self, deal_id: str) -> dict:
        """Research brand partnership rates and generate recommendations."""
        deal = self.db.query(BrandDeal).filter(BrandDeal.id == deal_id).first()
        if not deal:
            raise ValueError(f"Deal {deal_id} not found")

        creator = self.db.query(Creator).filter(Creator.id == deal.creator_id).first()

        prompt = f"""Research brand partnership rates for:
- Brand: {deal.brand_name}
- Creator: {creator.name if creator else 'Unknown'}
- Deliverables: {deal.deliverables}

Provide rate benchmarking as JSON with:
- suggested_rates (percentile25, percentile50, percentile75)
- comparable_creators (list)
- brand_industry (string)
- typical_requirements (list)
- negotiation_tips (list)"""

        research = await self.llm.generate_json(prompt, tier="critical")

        deal.research_data = research
        self.db.commit()

        self.log_action("brand_researched", deal.creator_id, {"deal_id": deal_id, "brand": deal.brand_name})
        return {
            "deal_id": deal_id,
            **research,
        }

    async def generate_outreach(self, deal_id: str, tone: str = "formal") -> str:
        """Generate an outreach email for a brand deal."""
        deal = self.db.query(BrandDeal).filter(BrandDeal.id == deal_id).first()
        if not deal:
            raise ValueError(f"Deal {deal_id} not found")

        creator = self.db.query(Creator).filter(Creator.id == deal.creator_id).first()

        system_prompt = f"""You are a professional talent manager writing outreach emails for brand partnerships.
Tone: {tone}
Make it concise, professional, and personalized."""

        prompt = f"""Write an outreach email to {deal.brand_name} on behalf of {creator.name if creator else 'the creator'}.
Proposed deliverables: {deal.deliverables}
Proposed rate: {deal.proposed_rate}
Include a compelling pitch about why this partnership would be mutually beneficial."""

        email = await self.llm.generate_text(prompt, system_prompt=system_prompt, tier="critical")

        deal.outreach_email = email
        deal.last_contact = datetime.utcnow()
        self.db.commit()

        self.log_action("outreach_generated", deal.creator_id, {"deal_id": deal_id, "tone": tone})
        return email

    async def suggest_counter_offer(self, deal_id: str) -> dict:
        """Suggest a counter-offer based on research data."""
        deal = self.db.query(BrandDeal).filter(BrandDeal.id == deal_id).first()
        if not deal:
            raise ValueError(f"Deal {deal_id} not found")

        research = deal.research_data or {}
        rates = research.get("suggested_rates", {})
        current_offer = deal.proposed_rate or 0

        system_prompt = "You are a negotiation expert for influencer brand deals."
        prompt = f"""Current offer: ₹{current_offer}
Market rates: 25th percentile: ₹{rates.get('percentile25', 0)}, 50th: ₹{rates.get('percentile50', 0)}, 75th: ₹{rates.get('percentile75', 0)}
Deliverables: {deal.deliverables}

Suggest a counter-offer with reasoning and a negotiation script."""

        response = await self.llm.generate_text(prompt, system_prompt=system_prompt, tier="critical")

        suggested = rates.get("percentile50", current_offer * 1.3) if rates else current_offer * 1.3

        self.log_action("counter_offer_suggested", deal.creator_id, {"deal_id": deal_id})
        return {
            "deal_id": deal_id,
            "suggested_amount": suggested,
            "reasoning": response,
            "negotiation_script": response,
        }

    async def generate_media_kit(self, creator_id: str) -> MediaKit:
        """Generate or update a media kit for a creator."""
        creator = self.db.query(Creator).filter(Creator.id == creator_id).first()
        if not creator:
            raise ValueError(f"Creator {creator_id} not found")

        # Gather stats
        total_content = self.db.query(Content).filter(Content.creator_id == creator_id).count()
        performances = (
            self.db.query(Performance)
            .join(Content)
            .filter(Content.creator_id == creator_id)
            .all()
        )

        follower_counts = {}
        engagement_rates = {}

        # Mock follower/engagement data per platform
        for platform in (creator.platforms or ["instagram"]):
            follower_counts[platform] = 10000 + hash(f"{creator_id}:{platform}") % 90000
            if performances:
                avg_engagement = sum(p.engagement_rate for p in performances) / len(performances)
                engagement_rates[platform] = round(avg_engagement, 2)
            else:
                engagement_rates[platform] = round(2.5 + (hash(f"{creator_id}:{platform}") % 50) / 10, 2)

        top_content = []
        top_posts = (
            self.db.query(Content)
            .filter(Content.creator_id == creator_id, Content.status == "published")
            .limit(5)
            .all()
        )
        for post in top_posts:
            top_content.append({"text": post.text[:100], "platform": post.platforms, "created_at": str(post.created_at)})

        # Upsert media kit
        kit = self.db.query(MediaKit).filter(MediaKit.creator_id == creator_id).first()
        if kit:
            kit.follower_counts = follower_counts
            kit.engagement_rates = engagement_rates
            kit.audience_demographics = {"age_18_24": 35, "age_25_34": 40, "age_35_44": 15, "male": 45, "female": 55}
            kit.top_content = top_content
            kit.generated_at = datetime.utcnow()
        else:
            kit = MediaKit(
                id=str(uuid.uuid4()),
                creator_id=creator_id,
                follower_counts=follower_counts,
                engagement_rates=engagement_rates,
                audience_demographics={"age_18_24": 35, "age_25_34": 40, "age_35_44": 15, "male": 45, "female": 55},
                top_content=top_content,
                generated_at=datetime.utcnow(),
            )
            self.db.add(kit)

        self.db.commit()
        self.db.refresh(kit)

        self.log_action("media_kit_generated", creator_id, {"kit_id": kit.id})
        return kit
