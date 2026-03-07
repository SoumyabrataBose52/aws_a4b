"""
Keyword Extractor Service — Extracts trending keywords from YouTube content.

Uses a combination of:
1. TF-based keyword extraction from video titles, tags, and descriptions
2. Gemini-powered topic clustering to group related keywords into themes
3. Temporal comparison to detect emerging vs. declining topics
"""

import logging
import re
from collections import Counter
from typing import Optional

from app.services.youtube_service import YouTubeService
from app.llm.base import get_llm_provider

logger = logging.getLogger(__name__)

# Common stop words to filter out
_STOP_WORDS = set(
    "the a an and or but in on at to for of is it this that was be are were been "
    "has have had do does did will would could should may might with from by as "
    "not no they them their we our you your he she his her its how what when where "
    "why who which can all just more most very so than too also into over after "
    "before between under out up about being each few many some such like new only "
    "even still back get got make made much any through those these don't now then "
    "here there own same another both during every last long first"
).split()


def _clean_text(text: str) -> list[str]:
    """Tokenize and clean text, removing stopwords and punctuation."""
    text = re.sub(r'[^\w\s#@]', ' ', text.lower())
    text = re.sub(r'\s+', ' ', text).strip()
    words = text.split()
    return [w for w in words if w not in _STOP_WORDS and len(w) > 2 and not w.isdigit()]


def _extract_hashtags(text: str) -> list[str]:
    """Extract hashtags from text."""
    return re.findall(r'#(\w+)', text.lower())


def extract_keywords_from_videos(videos: list[dict], top_n: int = 30) -> dict:
    """
    Extract trending keywords from a list of video metadata.
    
    Returns:
        {
            "keywords": [{"word": str, "count": int, "source": str}],
            "hashtags": [{"tag": str, "count": int}],
            "bigrams": [{"phrase": str, "count": int}],
        }
    """
    word_counter = Counter()
    hashtag_counter = Counter()
    bigram_counter = Counter()
    tag_counter = Counter()

    for video in videos:
        title = video.get("title", "")
        description = video.get("description", "")[:500]
        tags = video.get("tags", [])

        # Extract words from title (weighted 3x)
        title_words = _clean_text(title)
        for w in title_words:
            word_counter[w] += 3

        # Extract words from description (weighted 1x)
        desc_words = _clean_text(description)
        for w in desc_words:
            word_counter[w] += 1

        # Video tags (weighted 2x)
        for tag in tags:
            tag_clean = tag.lower().strip()
            if tag_clean:
                tag_counter[tag_clean] += 2
                for w in _clean_text(tag_clean):
                    word_counter[w] += 2

        # Extract hashtags from title + description
        for text in [title, description]:
            for ht in _extract_hashtags(text):
                hashtag_counter[ht] += 1

        # Bigrams from titles (most impactful)
        for i in range(len(title_words) - 1):
            bigram = f"{title_words[i]} {title_words[i+1]}"
            bigram_counter[bigram] += 1

    # Build result
    keywords = [
        {"word": word, "count": count, "source": "combined"}
        for word, count in word_counter.most_common(top_n)
    ]
    hashtags = [
        {"tag": tag, "count": count}
        for tag, count in hashtag_counter.most_common(15)
    ]
    bigrams = [
        {"phrase": phrase, "count": count}
        for phrase, count in bigram_counter.most_common(15)
        if count >= 2
    ]

    return {"keywords": keywords, "hashtags": hashtags, "bigrams": bigrams}


async def cluster_keywords_with_gemini(keyword_data: dict, videos: list[dict]) -> dict:
    """
    Use Gemini to cluster raw keywords into meaningful topic groups
    and identify emerging trends.
    """
    llm = get_llm_provider()

    top_keywords = [k["word"] for k in keyword_data.get("keywords", [])[:25]]
    top_hashtags = [h["tag"] for h in keyword_data.get("hashtags", [])[:10]]
    top_bigrams = [b["phrase"] for b in keyword_data.get("bigrams", [])[:10]]
    top_titles = [v.get("title", "") for v in videos[:15]]

    prompt = f"""Analyze these trending YouTube keywords and identify the main topic clusters and emerging trends.

TRENDING KEYWORDS (by frequency): {', '.join(top_keywords)}
HASHTAGS: {', '.join(['#' + h for h in top_hashtags])}
KEY PHRASES: {', '.join(top_bigrams)}
SAMPLE VIDEO TITLES:
{chr(10).join(['- ' + t for t in top_titles])}

Return a JSON object:
{{
  "topic_clusters": [
    {{
      "topic": "Name of the topic/theme",
      "keywords": ["relevant", "keywords", "from", "the", "list"],
      "trend_direction": "rising or stable or declining",
      "description": "Brief description of this trend"
    }}
  ],
  "emerging_topics": ["topics that appear to be newly trending"],
  "content_opportunities": ["specific content ideas creators could capitalize on"],
  "summary": "2-3 sentence overview of the current trending landscape"
}}"""

    system_prompt = "You are a social media trend analyst. Analyze YouTube trending data and identify actionable topic clusters and content opportunities for creators."

    try:
        result = await llm.generate_json(prompt, system_prompt=system_prompt, temperature=0.4)
        return {
            "topic_clusters": result.get("topic_clusters", []),
            "emerging_topics": result.get("emerging_topics", []),
            "content_opportunities": result.get("content_opportunities", []),
            "summary": result.get("summary", ""),
        }
    except Exception as e:
        logger.error(f"Gemini keyword clustering failed: {e}")
        return {
            "topic_clusters": [],
            "emerging_topics": [],
            "content_opportunities": [],
            "summary": "AI topic clustering unavailable.",
        }


async def get_trending_keywords(region: str = "IN", max_videos: int = 30) -> dict:
    """
    Full pipeline: fetch trending videos → extract keywords → cluster with Gemini.
    """
    yt = YouTubeService()
    videos = yt.get_trending_videos(region_code=region, max_results=max_videos)

    if not videos:
        return {"keywords": [], "hashtags": [], "bigrams": [], "clusters": {}, "video_count": 0}

    # Get detailed video info (includes tags)
    video_ids = [v.get("video_id") for v in videos if v.get("video_id")]
    detailed = yt.get_video_details(video_ids) if video_ids else videos

    # Extract raw keywords
    keyword_data = extract_keywords_from_videos(detailed)

    # Cluster with Gemini
    clusters = await cluster_keywords_with_gemini(keyword_data, detailed)

    return {
        **keyword_data,
        "clusters": clusters,
        "video_count": len(videos),
        "region": region,
    }
