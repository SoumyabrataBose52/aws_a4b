"""
Comment Analyzer Service — Orchestrates the full analysis pipeline.

1. Fetches YouTube comments via YouTubeService
2. Runs transformer-based sentiment scoring via SentimentService
3. Groups results into equal time intervals
4. Sends to LLM (AWS Bedrock Claude Opus 4.6) for keyword extraction and alert generation
5. Returns a comprehensive analysis result
"""

import json
import logging
import uuid
from datetime import datetime, timedelta
from dateutil import parser as dt_parser
from sqlalchemy.orm import Session

from app.services.youtube_service import YouTubeService
from app.services import sentiment_service
from app.llm.base import get_llm_provider
from app.config import get_settings
from app.models.crisis import CommentAnalysis
from app.events.bus import event_bus

logger = logging.getLogger(__name__)


async def analyze_video_comments(
    video_id: str,
    db: Session,
    creator_id: str | None = None,
    interval_seconds: int = 30,
    max_comments: int = 100,
) -> dict:
    """
    Full pipeline: fetch comments → transformer sentiment → time intervals → Gemini keywords/alerts.
    """
    # 1. Fetch comments from YouTube
    logger.info(f"Fetching comments for video {video_id} (max={max_comments})")
    yt = YouTubeService()
    raw_comments = yt.get_video_comments(video_id, max_results=max_comments)

    if not raw_comments:
        return _empty_result(video_id, creator_id)

    # 2. Run transformer sentiment analysis
    texts = [c["text"] for c in raw_comments]
    logger.info(f"Running sentiment analysis on {len(texts)} comments...")
    sentiment_results = sentiment_service.analyze_batch(texts)

    # 3. Merge results with comment metadata
    analyzed_comments = []
    for comment, sentiment in zip(raw_comments, sentiment_results):
        # Derive a star_rating from the continuous score for display
        # Maps -1.0..+1.0 to 1..5
        star_rating = max(1, min(5, round((sentiment.score + 1) * 2.5)))
        analyzed_comments.append({
            "comment_id": comment.get("comment_id", ""),
            "author": comment.get("author", "Unknown"),
            "text": comment["text"][:300],
            "likes": comment.get("likes", 0),
            "published_at": comment.get("published_at", ""),
            "sentiment_score": sentiment.score,
            "sentiment_label": sentiment.label,
            "confidence": sentiment.confidence,
            "star_rating": star_rating,
        })

    # 4. Compute aggregate stats
    aggregate = sentiment_service.get_aggregate(sentiment_results)

    # 5. Group into time intervals
    time_intervals = _build_time_intervals(analyzed_comments, interval_seconds)

    # 6. Call LLM (Bedrock Claude Opus 4.6) for keyword extraction and alert generation
    keywords, alerts, llm_summary = await _llm_analyze(
        analyzed_comments, aggregate, time_intervals
    )

    # 7. Persist to database
    analysis_record = CommentAnalysis(
        id=str(uuid.uuid4()),
        video_id=video_id,
        creator_id=creator_id,
        total_comments=len(analyzed_comments),
        avg_sentiment=aggregate.avg_score,
        sentiment_distribution=aggregate.distribution,
        keywords=keywords,
        alerts=alerts,
        time_intervals=time_intervals,
        gemini_summary=llm_summary,
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    # 8. Publish event if critical alerts detected
    critical_alerts = [a for a in alerts if a.get("severity") == "critical"]
    if critical_alerts:
        await event_bus.publish("comment_crisis_detected", {
            "analysis_id": analysis_record.id,
            "video_id": video_id,
            "creator_id": creator_id,
            "avg_sentiment": aggregate.avg_score,
            "critical_alerts": critical_alerts,
        }, source_agent="comment_analyzer")

    # 9. Build response
    return {
        "id": analysis_record.id,
        "video_id": video_id,
        "creator_id": creator_id,
        "total_comments": len(analyzed_comments),
        "avg_sentiment": aggregate.avg_score,
        "sentiment_distribution": aggregate.distribution,
        "most_negative": aggregate.most_negative,
        "most_positive": aggregate.most_positive,
        "anomaly_detected": aggregate.anomaly_detected,
        "anomaly_message": aggregate.anomaly_message,
        "keywords": keywords,
        "alerts": alerts,
        "time_intervals": time_intervals,
        "gemini_summary": llm_summary,
        "comments": analyzed_comments,
        "analyzed_at": analysis_record.analyzed_at.isoformat(),
    }


def _build_time_intervals(comments: list[dict], interval_seconds: int) -> list[dict]:
    """
    Group comments into equal time intervals based on published_at timestamps.
    Returns a list of interval snapshots with aggregated sentiment.
    """
    if not comments:
        return []

    # Parse timestamps and sort
    timed = []
    for c in comments:
        try:
            ts = dt_parser.isoparse(c["published_at"])
            timed.append({**c, "_ts": ts})
        except (ValueError, KeyError):
            continue

    if not timed:
        # If no parseable timestamps, create a single interval with all comments
        scores = [c["sentiment_score"] for c in comments]
        return [{
            "interval_index": 0,
            "start": "",
            "end": "",
            "comment_count": len(comments),
            "avg_score": round(sum(scores) / len(scores), 4) if scores else 0,
            "min_score": min(scores) if scores else 0,
            "max_score": max(scores) if scores else 0,
        }]

    timed.sort(key=lambda x: x["_ts"])

    min_ts = timed[0]["_ts"]
    max_ts = timed[-1]["_ts"]

    # Calculate number of intervals
    total_seconds = max((max_ts - min_ts).total_seconds(), 1)
    num_intervals = max(int(total_seconds / interval_seconds), 1)

    # Cap at 50 intervals from the start to avoid recursion issues
    if num_intervals > 50:
        interval_seconds = max(int(total_seconds / 50), 60)
        num_intervals = min(int(total_seconds / interval_seconds), 50)

    intervals = []
    for i in range(num_intervals):
        start = min_ts + timedelta(seconds=i * interval_seconds)
        end = min_ts + timedelta(seconds=(i + 1) * interval_seconds)

        bucket = [c for c in timed if start <= c["_ts"] < end]

        if not bucket:
            intervals.append({
                "interval_index": i,
                "start": start.isoformat(),
                "end": end.isoformat(),
                "comment_count": 0,
                "avg_score": 0.0,
                "min_score": 0.0,
                "max_score": 0.0,
            })
            continue

        scores = [c["sentiment_score"] for c in bucket]
        intervals.append({
            "interval_index": i,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "comment_count": len(bucket),
            "avg_score": round(sum(scores) / len(scores), 4),
            "min_score": min(scores),
            "max_score": max(scores),
        })

    return intervals


async def _llm_analyze(
    comments: list[dict],
    aggregate,
    time_intervals: list[dict],
) -> tuple[dict, list[dict], str]:
    """
    Use LLM (AWS Bedrock Claude Opus 4.6 via critical tier) to extract keywords,
    generate alerts, and summarize the sentiment trajectory.
    Includes robust fallback: if generate_json fails, tries generate_text with manual JSON parsing.
    """
    llm = get_llm_provider()

    # Prepare a CONDENSED version for Gemini (stay within token limits)
    sample_size = min(30, len(comments))
    sample_comments = sorted(comments, key=lambda c: abs(c["sentiment_score"]), reverse=True)[:sample_size]
    comment_lines = []
    for c in sample_comments:
        score_str = f"{c['sentiment_score']:+.2f}"
        comment_lines.append(f"[{c['sentiment_label']}|{score_str}] {c['text'][:100]}")
    comment_text_block = "\n".join(comment_lines)

    # Build interval summary — compact
    iv_lines = []
    for iv in time_intervals[:15]:
        if iv["comment_count"] > 0:
            iv_lines.append(f"Interval {iv['interval_index']+1}: {iv['comment_count']} comments, avg={iv['avg_score']:.2f}")
    interval_block = "\n".join(iv_lines) if iv_lines else "No time intervals available."

    prompt = f"""Analyze this YouTube comment sentiment data and extract insights.

SENTIMENT SUMMARY:
- Total: {len(comments)} comments | Average score: {aggregate.avg_score:.2f}
- Distribution: positive={aggregate.distribution.get('positive',0)+aggregate.distribution.get('very_positive',0):.0f}%, neutral={aggregate.distribution.get('neutral',0):.0f}%, negative={aggregate.distribution.get('negative',0)+aggregate.distribution.get('very_negative',0):.0f}%
- Anomaly: {aggregate.anomaly_detected}

TIME TRENDS:
{interval_block}

REPRESENTATIVE COMMENTS (sorted by score intensity):
{comment_text_block}

Return a JSON object with this exact structure:
{{
  "keywords": {{
    "crisis": ["terms indicating PR risk or negativity from the actual comments"],
    "positive": ["terms indicating good reception from the actual comments"],
    "trending": ["most discussed topics regardless of sentiment"]
  }},
  "alerts": [
    {{
      "severity": "info or warning or critical",
      "message": "actionable description of the alert",
      "keyword": "related keyword"
    }}
  ],
  "summary": "A 2-3 sentence narrative about the comment sentiment, key themes, and any risks detected."
}}"""

    system_prompt = """You are a social media crisis analyst AI. Analyze YouTube comment sentiment data and extract:
1. Real keywords from the actual comment text (not generic terms)
2. Actionable alerts based on sentiment patterns
3. A concise narrative summary

Be specific. Use actual words from the comments. If sentiment is mostly positive, say so. If there are risks, explain them clearly."""

    # Attempt 1: generate_json (structured output) — uses critical tier (Claude Opus 4.6)
    try:
        logger.info("Calling LLM generate_json for comment analysis (tier=critical)...")
        result = await llm.generate_json(prompt, system_prompt=system_prompt, temperature=0.3, max_tokens=1500, tier="critical")
        logger.info(f"LLM generate_json succeeded. Keys: {list(result.keys())}")
        keywords = result.get("keywords", {"crisis": [], "positive": [], "trending": []})
        alerts = result.get("alerts", [])
        summary = result.get("summary", "Analysis complete.")
        return keywords, alerts, summary
    except Exception as e:
        logger.warning(f"LLM generate_json failed: {type(e).__name__}: {e}")

    # Attempt 2: generate_text and parse JSON manually (also uses critical tier)
    try:
        logger.info("Falling back to LLM generate_text for comment analysis (tier=critical)...")
        raw_text = await llm.generate_text(
            prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown fences.",
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=1500,
            tier="critical",
        )
        logger.info(f"LLM generate_text response length: {len(raw_text)}")
        # Clean markdown fences
        text = raw_text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        result = json.loads(text)
        keywords = result.get("keywords", {"crisis": [], "positive": [], "trending": []})
        alerts = result.get("alerts", [])
        summary = result.get("summary", "Analysis complete.")
        return keywords, alerts, summary
    except Exception as e:
        logger.error(f"LLM generate_text fallback also failed: {type(e).__name__}: {e}")

    # Attempt 3: Gemini fallback (as requested explicitly)
    try:
        logger.info("Falling back to Gemini for comment analysis...")
        from app.llm.gemini import GeminiProvider
        settings = get_settings()
        gemini_llm = GeminiProvider(api_key=settings.GEMINI_API_KEY, model_name="gemini-3-flash-preview")
        result = await gemini_llm.generate_json(prompt, system_prompt=system_prompt, temperature=0.3, max_tokens=1500)
        
        keywords = result.get("keywords", {"crisis": [], "positive": [], "trending": []})
        alerts = result.get("alerts", [])
        summary = result.get("summary", "Analysis complete.")
        return keywords, alerts, summary
    except Exception as e:
        logger.error(f"Gemini fallback also failed: {type(e).__name__}: {e}")

    # Final fallback: no LLM available
    logger.error("All LLM attempts failed. Returning fallback analysis.")
    llm_summary = f"Analyzed {len(comments)} comments with average sentiment {aggregate.avg_score:+.2f}. AI summary could not be generated."
    return (
        {"crisis": [], "positive": [], "trending": []},
        [{"severity": "info", "message": "AI keyword analysis unavailable — using plain sentiment scores.", "keyword": "fallback"}],
        llm_summary,
    )


def _empty_result(video_id: str, creator_id: str | None) -> dict:
    """Return an empty analysis result when no comments are found."""
    return {
        "id": None,
        "video_id": video_id,
        "creator_id": creator_id,
        "total_comments": 0,
        "avg_sentiment": 0.0,
        "sentiment_distribution": {"very_negative": 0, "negative": 0, "neutral": 0, "positive": 0, "very_positive": 0},
        "most_negative": [],
        "most_positive": [],
        "anomaly_detected": False,
        "anomaly_message": None,
        "keywords": {"crisis": [], "positive": [], "trending": []},
        "alerts": [],
        "time_intervals": [],
        "gemini_summary": "No comments found for this video.",
        "comments": [],
        "analyzed_at": datetime.utcnow().isoformat(),
    }
