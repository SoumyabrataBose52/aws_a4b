from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.services.youtube_service import YouTubeService

router = APIRouter(prefix="/api/v1/youtube", tags=["YouTube"], dependencies=[Depends(verify_api_key)])


def get_youtube() -> YouTubeService:
    return YouTubeService()


@router.get("/channel/{identifier}")
def get_channel(identifier: str, yt: YouTubeService = Depends(get_youtube)):
    """Lookup a YouTube channel by @handle, username, or channel ID."""
    if identifier.startswith("UC"):
        channel = yt.get_channel_by_id(identifier)
    else:
        channel = yt.get_channel_by_username(identifier)

    if not channel:
        raise HTTPException(status_code=404, detail=f"Channel '{identifier}' not found")
    return channel


@router.get("/channel/{channel_id}/videos")
def get_channel_videos(channel_id: str, max_results: int = Query(20, ge=1, le=50), yt: YouTubeService = Depends(get_youtube)):
    """Get recent videos from a YouTube channel."""
    videos = yt.get_channel_videos(channel_id, max_results)
    if not videos:
        raise HTTPException(status_code=404, detail="No videos found or invalid channel ID")

    # Get detailed stats
    video_ids = [v["video_id"] for v in videos]
    details = yt.get_video_details(video_ids)
    return {"channel_id": channel_id, "count": len(details), "videos": details}


@router.get("/video/{video_id}/comments")
def get_video_comments(video_id: str, max_results: int = Query(50, ge=1, le=100), yt: YouTubeService = Depends(get_youtube)):
    """Get comments from a YouTube video (for sentiment analysis)."""
    comments = yt.get_video_comments(video_id, max_results)
    return {"video_id": video_id, "count": len(comments), "comments": comments}


@router.get("/trending")
def get_trending(region: str = "IN", max_results: int = Query(20, ge=1, le=50), yt: YouTubeService = Depends(get_youtube)):
    """Get trending YouTube videos for a region (default: India)."""
    trending = yt.get_trending_videos(region, max_results)
    return {"region": region, "count": len(trending), "videos": trending}


@router.get("/search")
def search_videos(q: str, max_results: int = Query(10, ge=1, le=25), yt: YouTubeService = Depends(get_youtube)):
    """Search YouTube for videos on a topic."""
    results = yt.search_videos(q, max_results)
    return {"query": q, "count": len(results), "results": results}


@router.get("/trending/keywords")
async def get_trending_keywords(
    region: str = Query("IN", description="Region code (e.g., IN, US, GB)"),
    max_videos: int = Query(30, ge=5, le=50),
):
    """Extract trending keywords from YouTube trending videos with AI-powered topic clustering."""
    from app.services.keyword_extractor import get_trending_keywords as extract
    result = await extract(region=region, max_videos=max_videos)
    return result
