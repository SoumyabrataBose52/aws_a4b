"""
Sentiment Analysis Service using pretrained HuggingFace transformers.

Uses cardiffnlp/twitter-roberta-base-sentiment-latest — a 3-class sentiment
model (negative/neutral/positive) trained on ~124M tweets.

Emoji Processing:
  - Emojis are demojized (converted to text descriptions) so the model can
    understand their meaning (e.g., 🔥 → "fire", 😂 → "face with tears of joy")
  - An emoji sentiment score is computed from known positive/negative emoji groups
  - The final score blends model prediction with emoji signal for accuracy
"""

import logging
import math
import re
from dataclasses import dataclass
from typing import Optional

import emoji

logger = logging.getLogger(__name__)

# Lazy-loaded global — avoids slowing server startup
_pipeline = None

MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"

# ─── Emoji sentiment mappings ────────────────────────────────────────────────
# Strongly positive emojis
_POSITIVE_EMOJIS = set(
    "😀😃😄😁😆😅🤣😂🥰😍🤩😘😗😚😙😊🥲☺️😌"
    "🙂🤗🤭😋😛😜🤪😝👍👏🙌🤟💪🎉🎊🥳🔥✨🌟⭐"
    "💯❤️🧡💛💚💙💜🖤🤍🤎💗💖💝💞💕❣️💟💓💘"
    "🥇🏆👑😎🫶🫡😇💐🌹🌺💎✅🆗👌👋"
)

# Strongly negative emojis
_NEGATIVE_EMOJIS = set(
    "😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤮🤢"
    "😱😨😰😥😓💀☠️👎🖕😈👿💩🤡🚫❌⛔🔴😒😑😐"
    "😷🤒🤕🤧😪😵💔🥀👻😰😬🫤🫠🙄"
)

# Neutral/ambiguous emojis — ignored in emoji scoring
# (anything not in positive or negative is treated as neutral)


def _compute_emoji_sentiment(text: str) -> tuple[float, int]:
    """
    Compute an emoji-based sentiment signal from the text.
    Returns (emoji_score, emoji_count) where score is -1.0 to +1.0.
    """
    emojis_found = [ch for ch in text if emoji.is_emoji(ch)]
    if not emojis_found:
        return 0.0, 0

    pos_count = sum(1 for e in emojis_found if e in _POSITIVE_EMOJIS)
    neg_count = sum(1 for e in emojis_found if e in _NEGATIVE_EMOJIS)
    total_sentiment = pos_count + neg_count

    if total_sentiment == 0:
        return 0.0, len(emojis_found)

    # Score: ratio of positive vs negative sentiment emojis → -1.0 to +1.0
    score = (pos_count - neg_count) / total_sentiment
    return round(score, 4), len(emojis_found)


def _preprocess_text(text: str) -> str:
    """
    Pre-process text for the sentiment model:
    1. Demojize emojis → text descriptions (🔥 → ":fire:")
    2. Clean up the demojized colons into readable words (":fire:" → "fire")
    """
    # Convert emojis to text descriptions
    processed = emoji.demojize(text, delimiters=(" ", " "))
    # Clean up underscores in emoji names for readability
    processed = re.sub(r'_', ' ', processed)
    return processed


@dataclass
class SentimentResult:
    text: str
    score: float          # -1.0 (very negative) to 1.0 (very positive)
    label: str            # "very_negative", "negative", "neutral", "positive", "very_positive"
    confidence: float     # 0.0 to 1.0 — model confidence in winning label
    top_label: str        # Original model label: "negative", "neutral", "positive"
    emoji_score: float    # Emoji-only sentiment signal (-1.0 to +1.0)
    emoji_count: int      # Number of emojis detected


@dataclass
class AggregateScore:
    avg_score: float
    total: int
    distribution: dict
    most_negative: list
    most_positive: list
    anomaly_detected: bool
    anomaly_message: Optional[str] = None


def _get_pipeline():
    """Lazy-load the sentiment analysis pipeline on first use."""
    global _pipeline
    if _pipeline is None:
        logger.info(f"Loading sentiment analysis model ({MODEL_NAME})...")
        try:
            from transformers import pipeline as hf_pipeline
            _pipeline = hf_pipeline(
                "sentiment-analysis",
                model=MODEL_NAME,
                tokenizer=MODEL_NAME,
                truncation=True,
                max_length=512,
                top_k=None,  # Return all 3 class scores
            )
            logger.info("Sentiment model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            raise
    return _pipeline


def _scores_to_continuous(label_scores: dict) -> float:
    """
    Convert 3-class probabilities into a single continuous score from -1.0 to +1.0.
    score = P(positive) - P(negative)
    """
    p_pos = label_scores.get("positive", 0)
    p_neg = label_scores.get("negative", 0)
    return round(p_pos - p_neg, 4)


def _blend_with_emoji(model_score: float, emoji_score: float, emoji_count: int) -> float:
    """
    Blend the model's score with the emoji sentiment signal.

    - If no emojis, return model score as-is
    - If emojis are present, blend proportionally to emoji density
    - More emojis = more emoji influence (capped at 30% weight)
    """
    if emoji_count == 0 or emoji_score == 0.0:
        return model_score

    # Emoji weight: scales from 0.1 (1 emoji) to 0.3 (5+ emojis)
    emoji_weight = min(0.30, 0.08 * emoji_count)

    blended = (1 - emoji_weight) * model_score + emoji_weight * emoji_score
    return round(max(-1.0, min(1.0, blended)), 4)


def _score_to_label(score: float) -> str:
    """Map a continuous score to a human-readable 5-level label."""
    if score >= 0.5:
        return "very_positive"
    elif score >= 0.15:
        return "positive"
    elif score > -0.15:
        return "neutral"
    elif score > -0.5:
        return "negative"
    else:
        return "very_negative"


def analyze_single(text: str) -> SentimentResult:
    """Analyze sentiment of a single text string."""
    emoji_score, emoji_count = _compute_emoji_sentiment(text)
    processed = _preprocess_text(text)

    pipe = _get_pipeline()
    results = pipe(processed[:512])[0]

    label_scores = {item["label"]: item["score"] for item in results}
    model_score = _scores_to_continuous(label_scores)
    final_score = _blend_with_emoji(model_score, emoji_score, emoji_count)
    label = _score_to_label(final_score)
    top = max(results, key=lambda x: x["score"])

    return SentimentResult(
        text=text[:200],
        score=final_score,
        label=label,
        confidence=round(top["score"], 4),
        top_label=top["label"],
        emoji_score=emoji_score,
        emoji_count=emoji_count,
    )


def analyze_batch(texts: list[str], batch_size: int = 32) -> list[SentimentResult]:
    """Analyze sentiment of a batch of texts efficiently."""
    if not texts:
        return []

    pipe = _get_pipeline()
    results = []

    # Pre-compute emoji scores for all texts
    emoji_data = [_compute_emoji_sentiment(t) for t in texts]

    # Pre-process all texts (demojize)
    processed_texts = [_preprocess_text(t) for t in texts]

    for i in range(0, len(texts), batch_size):
        batch_processed = [t[:512] for t in processed_texts[i:i + batch_size]]
        batch_originals = texts[i:i + batch_size]
        batch_emoji = emoji_data[i:i + batch_size]

        try:
            predictions = pipe(batch_processed)
            for text, pred, (e_score, e_count) in zip(batch_originals, predictions, batch_emoji):
                label_scores = {item["label"]: item["score"] for item in pred}
                model_score = _scores_to_continuous(label_scores)
                final_score = _blend_with_emoji(model_score, e_score, e_count)
                label = _score_to_label(final_score)
                top = max(pred, key=lambda x: x["score"])

                results.append(SentimentResult(
                    text=text[:200],
                    score=final_score,
                    label=label,
                    confidence=round(top["score"], 4),
                    top_label=top["label"],
                    emoji_score=e_score,
                    emoji_count=e_count,
                ))
        except Exception as e:
            logger.error(f"Batch sentiment analysis failed: {e}")
            for text, (e_score, e_count) in zip(batch_originals, batch_emoji):
                results.append(SentimentResult(
                    text=text[:200], score=0.0, label="neutral",
                    confidence=0.0, top_label="neutral",
                    emoji_score=e_score, emoji_count=e_count,
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

    # Anomaly detection
    negative_pct = distribution.get("very_negative", 0) + distribution.get("negative", 0)
    anomaly = negative_pct > 50 or avg < -0.3
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
