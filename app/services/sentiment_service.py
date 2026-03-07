"""
Sentiment Analysis Service using pretrained HuggingFace transformers.

Uses nlptown/bert-base-multilingual-uncased-sentiment (5-star rating)
normalized to a -1.0 to 1.0 scale.
"""

import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy-loaded globals — avoids slowing server startup
_pipeline = None
_tokenizer = None


@dataclass
class SentimentResult:
    text: str
    score: float          # -1.0 (very negative) to 1.0 (very positive)
    label: str            # "very_negative", "negative", "neutral", "positive", "very_positive"
    confidence: float     # 0.0 to 1.0
    star_rating: int      # Original 1-5 star prediction


@dataclass
class AggregateScore:
    avg_score: float
    total: int
    distribution: dict          # {"very_negative": %, "negative": %, "neutral": %, "positive": %, "very_positive": %}
    most_negative: list         # Top N most negative comments
    most_positive: list         # Top N most positive comments
    anomaly_detected: bool
    anomaly_message: Optional[str] = None


# Map 1-5 star labels to normalized score and readable label
_STAR_MAP = {
    1: {"score": -1.0, "label": "very_negative"},
    2: {"score": -0.5, "label": "negative"},
    3: {"score":  0.0, "label": "neutral"},
    4: {"score":  0.5, "label": "positive"},
    5: {"score":  1.0, "label": "very_positive"},
}


def _get_pipeline():
    """Lazy-load the sentiment analysis pipeline on first use."""
    global _pipeline
    if _pipeline is None:
        logger.info("Loading sentiment analysis model (nlptown/bert-base-multilingual-uncased-sentiment)...")
        try:
            from transformers import pipeline as hf_pipeline
            _pipeline = hf_pipeline(
                "sentiment-analysis",
                model="nlptown/bert-base-multilingual-uncased-sentiment",
                tokenizer="nlptown/bert-base-multilingual-uncased-sentiment",
                truncation=True,
                max_length=512,
            )
            logger.info("Sentiment model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            raise
    return _pipeline


def analyze_single(text: str) -> SentimentResult:
    """Analyze sentiment of a single text string."""
    pipe = _get_pipeline()
    result = pipe(text[:512])[0]  # Truncate to max 512 chars

    # Model outputs labels like "1 star", "2 stars", etc.
    star = int(result["label"].split()[0])
    mapping = _STAR_MAP[star]

    return SentimentResult(
        text=text[:200],  # Store truncated for display
        score=mapping["score"],
        label=mapping["label"],
        confidence=round(result["score"], 4),
        star_rating=star,
    )


def analyze_batch(texts: list[str], batch_size: int = 32) -> list[SentimentResult]:
    """Analyze sentiment of a batch of texts efficiently."""
    if not texts:
        return []

    pipe = _get_pipeline()
    results = []

    # Process in batches for efficiency
    for i in range(0, len(texts), batch_size):
        batch = [t[:512] for t in texts[i:i + batch_size]]
        try:
            predictions = pipe(batch)
            for text, pred in zip(texts[i:i + batch_size], predictions):
                star = int(pred["label"].split()[0])
                mapping = _STAR_MAP[star]
                results.append(SentimentResult(
                    text=text[:200],
                    score=mapping["score"],
                    label=mapping["label"],
                    confidence=round(pred["score"], 4),
                    star_rating=star,
                ))
        except Exception as e:
            logger.error(f"Batch sentiment analysis failed: {e}")
            # Fallback: mark as neutral
            for text in batch:
                results.append(SentimentResult(
                    text=text[:200], score=0.0, label="neutral",
                    confidence=0.0, star_rating=3,
                ))

    return results


def get_aggregate(results: list[SentimentResult], top_n: int = 5) -> AggregateScore:
    """Compute aggregate statistics from a list of sentiment results."""
    if not results:
        return AggregateScore(
            avg_score=0.0, total=0,
            distribution={"very_negative": 0, "negative": 0, "neutral": 0, "positive": 0, "very_positive": 0},
            most_negative=[], most_positive=[],
            anomaly_detected=False,
        )

    scores = [r.score for r in results]
    avg = sum(scores) / len(scores)

    # Distribution
    label_counts = {"very_negative": 0, "negative": 0, "neutral": 0, "positive": 0, "very_positive": 0}
    for r in results:
        label_counts[r.label] = label_counts.get(r.label, 0) + 1

    total = len(results)
    distribution = {k: round(v / total * 100, 1) for k, v in label_counts.items()}

    # Top negative / positive
    sorted_by_score = sorted(results, key=lambda r: r.score)
    most_negative = [{"text": r.text, "score": r.score, "label": r.label} for r in sorted_by_score[:top_n]]
    most_positive = [{"text": r.text, "score": r.score, "label": r.label} for r in sorted_by_score[-top_n:]]

    # Anomaly detection: >40% negative comments or avg below -0.3
    negative_pct = distribution.get("very_negative", 0) + distribution.get("negative", 0)
    anomaly = negative_pct > 40 or avg < -0.3
    anomaly_msg = None
    if anomaly:
        anomaly_msg = f"High negative sentiment detected: {negative_pct:.0f}% negative, avg score {avg:.2f}"

    return AggregateScore(
        avg_score=round(avg, 4),
        total=total,
        distribution=distribution,
        most_negative=most_negative,
        most_positive=most_positive,
        anomaly_detected=anomaly,
        anomaly_message=anomaly_msg,
    )
