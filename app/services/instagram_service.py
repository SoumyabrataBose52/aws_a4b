"""
Instagram Graph API Service — OAuth, profile, media, and insights.

Uses the Facebook Graph API v21.0 for Instagram Business/Creator accounts.
The Instagram Basic Display API is deprecated; this uses the Graph API via
a Facebook Developer app with instagram_basic, instagram_manage_insights permissions.
"""

import logging
import httpx
from datetime import datetime, timedelta
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"
OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth"


class InstagramService:
    """Instagram Graph API integration for fetching creator data and insights."""

    def __init__(self):
        settings = get_settings()
        self.app_id = settings.INSTAGRAM_APP_ID
        self.app_secret = settings.INSTAGRAM_APP_SECRET
        self.redirect_uri = "http://localhost:8000/api/v1/instagram/callback"
        self._client = httpx.Client(timeout=30)

    # ─── OAuth Flow ───────────────────────────────────────────────────────

    def get_auth_url(self, state: str = "nexus") -> str:
        """Generate the Facebook OAuth authorization URL for Instagram permissions."""
        scopes = ",".join([
            "instagram_basic",
            "instagram_manage_insights",
            "instagram_manage_comments",
            "pages_show_list",
            "pages_read_engagement",
        ])
        return (
            f"{OAUTH_BASE}?client_id={self.app_id}"
            f"&redirect_uri={self.redirect_uri}"
            f"&scope={scopes}"
            f"&response_type=code"
            f"&state={state}"
        )

    def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for a short-lived access token, then convert to long-lived."""
        # Step 1: Get short-lived token
        resp = self._client.get(f"{GRAPH_API_BASE}/oauth/access_token", params={
            "client_id": self.app_id,
            "client_secret": self.app_secret,
            "redirect_uri": self.redirect_uri,
            "code": code,
        })
        data = resp.json()
        if "error" in data:
            logger.error(f"Token exchange failed: {data['error']}")
            return {"error": data["error"].get("message", "Token exchange failed")}

        short_token = data.get("access_token")

        # Step 2: Exchange for long-lived token (60 days)
        resp2 = self._client.get(f"{GRAPH_API_BASE}/oauth/access_token", params={
            "grant_type": "fb_exchange_token",
            "client_id": self.app_id,
            "client_secret": self.app_secret,
            "fb_exchange_token": short_token,
        })
        long_data = resp2.json()
        if "error" in long_data:
            logger.warning(f"Long-lived token exchange failed, using short-lived: {long_data['error']}")
            return {"access_token": short_token, "token_type": "short_lived", "expires_in": 3600}

        return {
            "access_token": long_data.get("access_token"),
            "token_type": "long_lived",
            "expires_in": long_data.get("expires_in", 5184000),  # ~60 days
        }

    # ─── Account Discovery ────────────────────────────────────────────────

    def get_instagram_accounts(self, access_token: str) -> list[dict]:
        """Get all Instagram Business/Creator accounts linked to the Facebook user."""
        # Get Facebook Pages
        resp = self._client.get(f"{GRAPH_API_BASE}/me/accounts", params={
            "access_token": access_token,
            "fields": "id,name,instagram_business_account",
        })
        data = resp.json()
        pages = data.get("data", [])

        accounts = []
        for page in pages:
            ig_account = page.get("instagram_business_account")
            if ig_account:
                # Fetch IG profile details
                profile = self.get_profile(ig_account["id"], access_token)
                if profile:
                    accounts.append({
                        "page_id": page["id"],
                        "page_name": page.get("name", ""),
                        "instagram_id": ig_account["id"],
                        **profile,
                    })

        return accounts

    # ─── Profile ──────────────────────────────────────────────────────────

    def get_profile(self, ig_user_id: str, access_token: str) -> Optional[dict]:
        """Fetch Instagram profile information."""
        fields = "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website"
        resp = self._client.get(f"{GRAPH_API_BASE}/{ig_user_id}", params={
            "fields": fields,
            "access_token": access_token,
        })
        data = resp.json()
        if "error" in data:
            logger.error(f"Profile fetch failed: {data['error']}")
            return None

        return {
            "id": data.get("id"),
            "username": data.get("username", ""),
            "name": data.get("name", ""),
            "bio": data.get("biography", ""),
            "followers": data.get("followers_count", 0),
            "following": data.get("follows_count", 0),
            "media_count": data.get("media_count", 0),
            "profile_picture": data.get("profile_picture_url", ""),
            "website": data.get("website", ""),
        }

    # ─── Media ────────────────────────────────────────────────────────────

    def get_media(self, ig_user_id: str, access_token: str, limit: int = 25) -> list[dict]:
        """Fetch recent media (posts, reels, carousels) from an Instagram account."""
        fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
        resp = self._client.get(f"{GRAPH_API_BASE}/{ig_user_id}/media", params={
            "fields": fields,
            "access_token": access_token,
            "limit": min(limit, 100),
        })
        data = resp.json()
        media_list = data.get("data", [])

        results = []
        for m in media_list:
            results.append({
                "id": m.get("id"),
                "caption": m.get("caption", "")[:500],
                "media_type": m.get("media_type", "").lower(),  # IMAGE, VIDEO, CAROUSEL_ALBUM
                "media_url": m.get("media_url", ""),
                "thumbnail_url": m.get("thumbnail_url", ""),
                "permalink": m.get("permalink", ""),
                "timestamp": m.get("timestamp", ""),
                "likes": m.get("like_count", 0),
                "comments": m.get("comments_count", 0),
            })

        return results

    # ─── Insights ─────────────────────────────────────────────────────────

    def get_account_insights(self, ig_user_id: str, access_token: str, period: str = "day", days: int = 7) -> dict:
        """Fetch account-level insights (reach, impressions, follower growth)."""
        metrics = "impressions,reach,follower_count,profile_views"
        since = int((datetime.utcnow() - timedelta(days=days)).timestamp())
        until = int(datetime.utcnow().timestamp())

        resp = self._client.get(f"{GRAPH_API_BASE}/{ig_user_id}/insights", params={
            "metric": metrics,
            "period": period,
            "since": since,
            "until": until,
            "access_token": access_token,
        })
        data = resp.json()
        if "error" in data:
            logger.error(f"Insights fetch failed: {data['error']}")
            return {"error": data["error"].get("message", "Insights fetch failed")}

        insights = {}
        for metric_data in data.get("data", []):
            name = metric_data.get("name")
            values = metric_data.get("values", [])
            insights[name] = {
                "title": metric_data.get("title", name),
                "description": metric_data.get("description", ""),
                "values": [{"end_time": v.get("end_time"), "value": v.get("value", 0)} for v in values],
                "total": sum(v.get("value", 0) for v in values if isinstance(v.get("value"), (int, float))),
            }

        return insights

    def get_media_insights(self, media_id: str, access_token: str, media_type: str = "image") -> dict:
        """Fetch insights for a specific media item."""
        if media_type in ("video", "reel"):
            metrics = "impressions,reach,likes,comments,shares,saved,plays,total_interactions"
        else:
            metrics = "impressions,reach,likes,comments,shares,saved,total_interactions"

        resp = self._client.get(f"{GRAPH_API_BASE}/{media_id}/insights", params={
            "metric": metrics,
            "access_token": access_token,
        })
        data = resp.json()
        if "error" in data:
            logger.error(f"Media insights failed for {media_id}: {data['error']}")
            return {}

        return {
            m.get("name"): m.get("values", [{}])[0].get("value", 0)
            for m in data.get("data", [])
        }

    # ─── Comments ─────────────────────────────────────────────────────────

    def get_media_comments(self, media_id: str, access_token: str, limit: int = 50) -> list[dict]:
        """Fetch comments on a specific media item."""
        resp = self._client.get(f"{GRAPH_API_BASE}/{media_id}/comments", params={
            "fields": "id,text,timestamp,username,like_count,replies{id,text,timestamp,username}",
            "access_token": access_token,
            "limit": min(limit, 100),
        })
        data = resp.json()
        comments = []
        for c in data.get("data", []):
            replies = c.get("replies", {}).get("data", [])
            comments.append({
                "id": c.get("id"),
                "text": c.get("text", ""),
                "timestamp": c.get("timestamp", ""),
                "username": c.get("username", ""),
                "likes": c.get("like_count", 0),
                "replies": [
                    {"id": r.get("id"), "text": r.get("text", ""), "username": r.get("username", ""), "timestamp": r.get("timestamp", "")}
                    for r in replies
                ],
            })

        return comments
