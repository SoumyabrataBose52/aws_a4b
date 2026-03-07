"""
Data Processing Pipeline — Unified multi-platform data aggregation + Gemini analysis.

Fetches data from YouTube and Instagram, normalizes it into a unified schema,
and feeds it to Gemini for cross-platform insights and content strategy recommendations.
"""

import logging
import uuid
from datetime import datetime
from typing import Optional

from app.services.youtube_service import YouTubeService
from app.services.instagram_service import InstagramService
from app.services import sentiment_service
from app.services.keyword_extractor import extract_keywords_from_videos
from app.llm.base import get_llm_provider

logger = logging.getLogger(__name__)


async def analyze_creator_platforms(
    youtube_channel_id: Optional[str] = None,
    instagram_user_id: Optional[str] = None,
    instagram_token: Optional[str] = None,
    max_items: int = 20,
) -> dict:
    """
    Full cross-platform analysis pipeline:
    1. Fetch data from YouTube and/or Instagram
    2. Normalize into unified schema
    3. Feed to Gemini for cross-platform analysis
    4. Return comprehensive insights
    """
    platform_data = {}

    # ─── YouTube Data ─────────────────────────────────────────────────
    if youtube_channel_id:
        logger.info(f"Fetching YouTube data for channel {youtube_channel_id}")
        yt = YouTubeService()

        try:
            # Channel info
            channel = yt.get_channel_by_id(youtube_channel_id)
            
            # Recent videos
            videos = yt.get_channel_videos(youtube_channel_id, max_results=max_items)
            video_ids = [v["video_id"] for v in videos] if videos else []
            detailed_videos = yt.get_video_details(video_ids) if video_ids else []

            # Extract keywords from channel's videos
            channel_keywords = extract_keywords_from_videos(detailed_videos)

            # Sentiment on latest video comments
            latest_video_sentiment = None
            if detailed_videos:
                top_video_id = detailed_videos[0].get("video_id", detailed_videos[0].get("id"))
                if top_video_id:
                    comments = yt.get_video_comments(top_video_id, max_results=30)
                    if comments:
                        texts = [c["text"] for c in comments]
                        sentiments = sentiment_service.analyze_batch(texts)
                        agg = sentiment_service.get_aggregate(sentiments)
                        latest_video_sentiment = {
                            "video_id": top_video_id,
                            "avg_score": agg.avg_score,
                            "distribution": agg.distribution,
                            "total_comments": agg.total,
                        }

            platform_data["youtube"] = {
                "channel": channel,
                "videos": detailed_videos[:max_items],
                "video_count": len(detailed_videos),
                "keywords": channel_keywords,
                "latest_sentiment": latest_video_sentiment,
                "total_views": sum(v.get("view_count", 0) for v in detailed_videos),
                "total_likes": sum(v.get("like_count", 0) for v in detailed_videos),
                "avg_views": round(sum(v.get("view_count", 0) for v in detailed_videos) / max(len(detailed_videos), 1)),
            }
        except Exception as e:
            logger.error(f"YouTube data fetch failed: {e}")
            platform_data["youtube"] = {"error": str(e)}

    # ─── Instagram Data ───────────────────────────────────────────────
    if instagram_user_id and instagram_token:
        logger.info(f"Fetching Instagram data for user {instagram_user_id}")
        ig = InstagramService()

        try:
            profile = ig.get_profile(instagram_user_id, instagram_token)
            media = ig.get_media(instagram_user_id, instagram_token, limit=max_items)
            insights = ig.get_account_insights(instagram_user_id, instagram_token, days=7)

            # Calculate engagement metrics
            total_likes = sum(m.get("likes", 0) for m in media)
            total_comments = sum(m.get("comments", 0) for m in media)
            followers = profile.get("followers", 1) if profile else 1
            engagement_rate = round((total_likes + total_comments) / (followers * max(len(media), 1)) * 100, 2) if followers > 0 else 0

            platform_data["instagram"] = {
                "profile": profile,
                "media": media[:max_items],
                "media_count": len(media),
                "insights": insights if "error" not in insights else None,
                "total_likes": total_likes,
                "total_comments": total_comments,
                "engagement_rate": engagement_rate,
            }
        except Exception as e:
            logger.error(f"Instagram data fetch failed: {e}")
            platform_data["instagram"] = {"error": str(e)}

    if not platform_data:
        return {"error": "No platform data provided. Supply at least one platform's credentials."}

    # ─── Gemini Cross-Platform Analysis ───────────────────────────────
    gemini_insights = await _gemini_cross_platform_analysis(platform_data)

    return {
        "id": str(uuid.uuid4()),
        "platforms": platform_data,
        "insights": gemini_insights,
        "analyzed_at": datetime.utcnow().isoformat(),
    }


async def auto_analyze_from_config(config: dict) -> dict:
    """
    Automated analysis given exact field configuration.
    Config format:
    {
        "youtube_channel_id": "UC...",
        "instagram_user_id": "...",
        "instagram_token": "...",
        "analysis_type": "full|content|audience|performance",
        "max_items": 20,
    }
    """
    return await analyze_creator_platforms(
        youtube_channel_id=config.get("youtube_channel_id"),
        instagram_user_id=config.get("instagram_user_id"),
        instagram_token=config.get("instagram_token"),
        max_items=config.get("max_items", 20),
    )


async def _gemini_cross_platform_analysis(platform_data: dict) -> dict:
    """Use Gemini to generate cross-platform insights from normalized data."""
    llm = get_llm_provider()

    # Build a condensed summary for Gemini
    summary_parts = []

    if "youtube" in platform_data and "error" not in platform_data["youtube"]:
        yt = platform_data["youtube"]
        channel = yt.get("channel", {})
        summary_parts.append(f"""YOUTUBE:
- Channel: {channel.get('title', 'Unknown')} ({channel.get('subscriber_count', 0)} subscribers)
- Recent videos: {yt.get('video_count', 0)}, Total views: {yt.get('total_views', 0)}, Avg views: {yt.get('avg_views', 0)}
- Top keywords: {', '.join([k['word'] for k in yt.get('keywords', {}).get('keywords', [])[:10]])}
- Latest video sentiment: {yt.get('latest_sentiment', {}).get('avg_score', 'N/A')} ({yt.get('latest_sentiment', {}).get('distribution', {})})""")

    if "instagram" in platform_data and "error" not in platform_data["instagram"]:
        ig = platform_data["instagram"]
        profile = ig.get("profile", {})
        summary_parts.append(f"""INSTAGRAM:
- Profile: @{profile.get('username', 'unknown')} ({profile.get('followers', 0)} followers)
- Posts analyzed: {ig.get('media_count', 0)}, Engagement rate: {ig.get('engagement_rate', 0)}%
- Total likes: {ig.get('total_likes', 0)}, Total comments: {ig.get('total_comments', 0)}""")

    if not summary_parts:
        return {"summary": "No platform data available for analysis."}

    platform_summary = "\n\n".join(summary_parts)

    prompt = f"""Analyze this creator's cross-platform social media data and provide strategic insights.

{platform_summary}

Return a JSON object:
{{
  "overall_health": "excellent|good|needs_attention|critical",
  "cross_platform_score": 0-100,
  "key_insights": [
    {{"insight": "Description of insight", "platform": "youtube|instagram|cross-platform", "priority": "high|medium|low"}}
  ],
  "content_recommendations": [
    {{"recommendation": "Description", "platform": "target platform", "expected_impact": "high|medium|low"}}
  ],
  "audience_analysis": {{
    "primary_audience": "Description of main audience",
    "growth_potential": "Description of growth opportunities",
    "cross_platform_overlap": "Assessment of audience overlap"
  }},
  "performance_summary": {{
    "strengths": ["List of strengths"],
    "weaknesses": ["List of areas to improve"],
    "opportunities": ["List of opportunities"]
  }},
  "action_items": [
    {{"action": "Specific action to take", "timeline": "immediate|this_week|this_month", "expected_result": "What to expect"}}
  ],
  "summary": "3-4 sentence executive summary of the creator's overall social media presence and strategy."
}}"""

    system_prompt = "You are a social media strategist and analytics expert. Provide data-driven, actionable insights based on cross-platform creator data. Be specific, not generic."

    try:
        result = await llm.generate_json(prompt, system_prompt=system_prompt, temperature=0.4, max_tokens=2000)
        return result
    except Exception as e:
        logger.error(f"Gemini cross-platform analysis failed: {e}")
        try:
            raw = await llm.generate_text(
                prompt + "\n\nRespond ONLY with valid JSON.",
                system_prompt=system_prompt, temperature=0.4, max_tokens=2000,
            )
            import json
            text = raw.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            return json.loads(text)
        except Exception as e2:
            logger.error(f"Gemini fallback also failed: {e2}")
            return {"summary": "AI cross-platform analysis unavailable.", "error": str(e2)}
