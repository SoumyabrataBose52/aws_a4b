"""Instagram Graph API router — OAuth, profile, media, insights."""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.services.instagram_service import InstagramService

router = APIRouter(prefix="/api/v1/instagram", tags=["Instagram"])


def get_instagram() -> InstagramService:
    return InstagramService()


# ─── OAuth Flow ───────────────────────────────────────────────────────────

@router.get("/auth")
def start_auth(state: str = "nexus", ig: InstagramService = Depends(get_instagram)):
    """Get the Instagram OAuth authorization URL."""
    return {"auth_url": ig.get_auth_url(state)}


@router.get("/callback")
def oauth_callback(code: str, state: str = "nexus", ig: InstagramService = Depends(get_instagram)):
    """Handle OAuth callback — exchange code for long-lived token."""
    result = ig.exchange_code_for_token(code)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ─── Account Discovery ────────────────────────────────────────────────────

@router.get("/accounts", dependencies=[Depends(verify_api_key)])
def list_instagram_accounts(
    access_token: str = Query(..., description="Facebook user access token"),
    ig: InstagramService = Depends(get_instagram),
):
    """List all Instagram Business/Creator accounts linked to the Facebook user."""
    accounts = ig.get_instagram_accounts(access_token)
    return {"count": len(accounts), "accounts": accounts}


# ─── Profile ──────────────────────────────────────────────────────────────

@router.get("/{ig_user_id}/profile", dependencies=[Depends(verify_api_key)])
def get_profile(
    ig_user_id: str,
    access_token: str = Query(..., description="Instagram access token"),
    ig: InstagramService = Depends(get_instagram),
):
    """Fetch Instagram profile information."""
    profile = ig.get_profile(ig_user_id, access_token)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


# ─── Media ────────────────────────────────────────────────────────────────

@router.get("/{ig_user_id}/media", dependencies=[Depends(verify_api_key)])
def get_media(
    ig_user_id: str,
    access_token: str = Query(..., description="Instagram access token"),
    limit: int = Query(25, ge=1, le=100),
    ig: InstagramService = Depends(get_instagram),
):
    """Fetch recent posts, reels, and carousels."""
    media = ig.get_media(ig_user_id, access_token, limit)
    return {"count": len(media), "media": media}


# ─── Insights ─────────────────────────────────────────────────────────────

@router.get("/{ig_user_id}/insights", dependencies=[Depends(verify_api_key)])
def get_account_insights(
    ig_user_id: str,
    access_token: str = Query(..., description="Instagram access token"),
    period: str = Query("day", description="Aggregation period: day, week, month, lifetime"),
    days: int = Query(7, ge=1, le=90),
    ig: InstagramService = Depends(get_instagram),
):
    """Fetch account-level insights (reach, impressions, followers)."""
    insights = ig.get_account_insights(ig_user_id, access_token, period, days)
    if "error" in insights:
        raise HTTPException(status_code=400, detail=insights["error"])
    return insights


@router.get("/media/{media_id}/insights", dependencies=[Depends(verify_api_key)])
def get_media_insights(
    media_id: str,
    access_token: str = Query(..., description="Instagram access token"),
    media_type: str = Query("image", description="image, video, or reel"),
    ig: InstagramService = Depends(get_instagram),
):
    """Fetch insights for a specific media item."""
    insights = ig.get_media_insights(media_id, access_token, media_type)
    return insights


# ─── Comments ─────────────────────────────────────────────────────────────

@router.get("/media/{media_id}/comments", dependencies=[Depends(verify_api_key)])
def get_media_comments(
    media_id: str,
    access_token: str = Query(..., description="Instagram access token"),
    limit: int = Query(50, ge=1, le=100),
    ig: InstagramService = Depends(get_instagram),
):
    """Fetch comments on a specific Instagram post."""
    comments = ig.get_media_comments(media_id, access_token, limit)
    return {"count": len(comments), "comments": comments}
