"""
Comment Analyzer Service — Orchestrates the full analysis pipeline.

1. Fetches YouTube comments via YouTubeService
2. Runs transformer-based sentiment scoring via SentimentService
3. Groups results into equal time intervals
4. Sends to Gemini for keyword extraction and alert generation
5. Returns a comprehensive analysis result
"""

import logging
import uuid
from datetime import datetime
from dateutil import parser as dt_parser
from sqlalchemy.orm import Session

from app.services.youtube_service import YouTubeService
from app.services import sentiment_service
from app.llm.base import get_llm_provider
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
        analyzed_comments.append({
            "comment_id": comment.get("comment_id", ""),
            "author": comment.get("author", "Unknown"),
            "text": comment["text"][:300],
            "likes": comment.get("likes", 0),
            "published_at": comment.get("published_at", ""),
            "sentiment_score": sentiment.score,
            "sentiment_label": sentiment.label,
            "confidence": sentiment.confidence,
            "star_rating": sentiment.star_rating,
        })

    # 4. Compute aggregate stats
    aggregate = sentiment_service.get_aggregate(sentiment_results)

    # 5. Group into time intervals
    time_intervals = _build_time_intervals(analyzed_comments, interval_seconds)

    # 6. Call Gemini for keyword extraction and alert generation
    keywords, alerts, gemini_summary = await _gemini_analyze(
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
        gemini_summary=gemini_summary,
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
        "gemini_summary": gemini_summary,
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

    intervals = []
    from datetime import timedelta

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

    # Cap at 50 intervals max to avoid massive payloads
    if len(intervals) > 50:
        # Re-bucket with larger intervals
        new_interval = int(total_seconds / 50)
        return _build_time_intervals(comments, max(new_interval, 60))

    return intervals


async def _gemini_analyze(
    comments: list[dict],
    aggregate,
    time_intervals: list[dict],
) -> tuple[dict, list[dict], str]:
    """
    Use Gemini to extract keywords, generate alerts, and summarize the sentiment trajectory.
    """
    llm = get_llm_provider()

    # Prepare a condensed version for Gemini (to stay within token limits)
    sample_comments = comments[:50]  # Send top 50 comments
    comment_texts = "\n".join([
        f"[{c['sentiment_label']}|{c['sentiment_score']:.1f}] {c['text'][:150]}"
        for c in sample_comments
    ])

    # Build interval summary
    interval_summary = "\n".join([
        f"Interval {iv['interval_index']}: {iv['comment_count']} comments, avg={iv['avg_score']:.2f}"
        for iv in time_intervals[:20]
    ])

    system_prompt = """You are a crisis management AI analyzing YouTube comment sentiment data.
You have been given comments already scored by a sentiment model. Your job is to:
1. Extract crisis keywords (negative trending terms that indicate a PR risk)
2. Extract positive keywords (terms indicating good reception)
3. Extract trending keywords (most mentioned topics regardless of sentiment)
4. Generate alerts if the sentiment data indicates risks
5. Write a brief summary narrative of the comment sentiment trajectory

Be specific and actionable. Focus on real keywords from the comments, not generic terms."""

    prompt = f"""Comment Sentiment Data:
- Total comments: {len(comments)}
- Average sentiment: {aggregate.avg_score:.2f}
- Distribution: {aggregate.distribution}
- Anomaly detected: {aggregate.anomaly_detected}

Time Intervals:
{interval_summary}

Sample Analyzed Comments:
{comment_texts}

Respond as JSON:
{{
  "keywords": {{
    "crisis": ["keyword1", "keyword2"],
    "positive": ["keyword1", "keyword2"],
    "trending": ["keyword1", "keyword2"]
  }},
  "alerts": [
    {{
      "severity": "info|warning|critical",
      "message": "Description of the alert",
      "keyword": "related keyword"
    }}
  ],
  "summary": "A 2-3 sentence narrative summary of the overall comment sentiment and trends."
}}"""

    try:
        result = await llm.generate_json(prompt, system_prompt=system_prompt, temperature=0.3)
        keywords = result.get("keywords", {"crisis": [], "positive": [], "trending": []})
        alerts = result.get("alerts", [])
        summary = result.get("summary", "Analysis complete.")
        return keywords, alerts, summary
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        # Fallback: generate basic keywords from comment texts
        return (
            {"crisis": [], "positive": [], "trending": []},
            [{"severity": "info", "message": "AI keyword analysis unavailable — using plain sentiment scores.", "keyword": "fallback"}],
            f"Analyzed {len(comments)} comments with average sentiment {aggregate.avg_score:.2f}. AI summary unavailable.",
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
