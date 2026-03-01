import logging
from datetime import datetime
from googleapiclient.discovery import build
from app.config import get_settings

logger = logging.getLogger(__name__)


class YouTubeService:
    """YouTube Data API v3 integration for pulling real creator data."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.YOUTUBE_API_KEY
        if not self.api_key:
            raise ValueError("YOUTUBE_API_KEY not set in .env")
        self.youtube = build("youtube", "v3", developerKey=self.api_key)

    def get_channel_by_username(self, username: str) -> dict | None:
        """Find a YouTube channel by username or handle."""
        # Try forHandle first (modern @handle)
        try:
            resp = self.youtube.channels().list(
                part="snippet,statistics,contentDetails",
                forHandle=username.lstrip("@"),
                maxResults=1,
            ).execute()
            if resp.get("items"):
                return self._parse_channel(resp["items"][0])
        except Exception as e:
            logger.warning(f"Handle lookup failed for {username}: {e}")

        # Fallback: search
        try:
            search = self.youtube.search().list(
                part="snippet", q=username, type="channel", maxResults=1
            ).execute()
            if search.get("items"):
                channel_id = search["items"][0]["snippet"]["channelId"]
                return self.get_channel_by_id(channel_id)
        except Exception as e:
            logger.error(f"Channel search failed for {username}: {e}")

        return None

    def get_channel_by_id(self, channel_id: str) -> dict | None:
        """Get channel details by channel ID."""
        try:
            resp = self.youtube.channels().list(
                part="snippet,statistics,contentDetails",
                id=channel_id,
            ).execute()
            if resp.get("items"):
                return self._parse_channel(resp["items"][0])
        except Exception as e:
            logger.error(f"Channel fetch failed for {channel_id}: {e}")
        return None

    def get_channel_videos(self, channel_id: str, max_results: int = 50) -> list[dict]:
        """Fetch recent videos from a channel (for DNA building)."""
        videos = []
        try:
            # Get uploads playlist
            channel = self.youtube.channels().list(
                part="contentDetails", id=channel_id
            ).execute()
            if not channel.get("items"):
                return []

            uploads_id = channel["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

            # Fetch videos from uploads playlist
            next_page = None
            while len(videos) < max_results:
                resp = self.youtube.playlistItems().list(
                    part="snippet,contentDetails",
                    playlistId=uploads_id,
                    maxResults=min(50, max_results - len(videos)),
                    pageToken=next_page,
                ).execute()

                for item in resp.get("items", []):
                    snippet = item["snippet"]
                    videos.append({
                        "video_id": snippet["resourceId"]["videoId"],
                        "title": snippet["title"],
                        "description": snippet.get("description", ""),
                        "published_at": snippet["publishedAt"],
                        "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                    })

                next_page = resp.get("nextPageToken")
                if not next_page:
                    break

        except Exception as e:
            logger.error(f"Failed to fetch videos for channel {channel_id}: {e}")

        return videos[:max_results]

    def get_video_details(self, video_ids: list[str]) -> list[dict]:
        """Get detailed stats for specific videos."""
        results = []
        # API supports max 50 IDs per call
        for i in range(0, len(video_ids), 50):
            batch = video_ids[i:i + 50]
            try:
                resp = self.youtube.videos().list(
                    part="snippet,statistics,contentDetails",
                    id=",".join(batch),
                ).execute()

                for item in resp.get("items", []):
                    stats = item.get("statistics", {})
                    results.append({
                        "video_id": item["id"],
                        "title": item["snippet"]["title"],
                        "description": item["snippet"].get("description", ""),
                        "published_at": item["snippet"]["publishedAt"],
                        "tags": item["snippet"].get("tags", []),
                        "category_id": item["snippet"].get("categoryId", ""),
                        "channel_title": item["snippet"].get("channelTitle", ""),
                        "thumbnail": item["snippet"].get("thumbnails", {}).get("high", {}).get("url", ""),
                        "duration": item["contentDetails"].get("duration", ""),
                        "views": int(stats.get("viewCount", 0)),
                        "likes": int(stats.get("likeCount", 0)),
                        "comments": int(stats.get("commentCount", 0)),
                    })
            except Exception as e:
                logger.error(f"Failed to fetch video details: {e}")

        return results

    def get_video_comments(self, video_id: str, max_results: int = 100) -> list[dict]:
        """Fetch comments for a video (for sentiment analysis)."""
        comments = []
        try:
            next_page = None
            while len(comments) < max_results:
                resp = self.youtube.commentThreads().list(
                    part="snippet",
                    videoId=video_id,
                    maxResults=min(100, max_results - len(comments)),
                    order="relevance",
                    pageToken=next_page,
                ).execute()

                for item in resp.get("items", []):
                    top = item["snippet"]["topLevelComment"]["snippet"]
                    comments.append({
                        "comment_id": item["id"],
                        "author": top.get("authorDisplayName", ""),
                        "text": top["textDisplay"],
                        "likes": top.get("likeCount", 0),
                        "published_at": top["publishedAt"],
                    })

                next_page = resp.get("nextPageToken")
                if not next_page:
                    break

        except Exception as e:
            logger.error(f"Failed to fetch comments for video {video_id}: {e}")

        return comments[:max_results]

    def get_trending_videos(self, region_code: str = "IN", max_results: int = 20) -> list[dict]:
        """Fetch trending videos for trend detection."""
        try:
            resp = self.youtube.videos().list(
                part="snippet,statistics",
                chart="mostPopular",
                regionCode=region_code,
                maxResults=max_results,
            ).execute()

            trending = []
            for item in resp.get("items", []):
                stats = item.get("statistics", {})
                trending.append({
                    "video_id": item["id"],
                    "title": item["snippet"]["title"],
                    "channel_title": item["snippet"]["channelTitle"],
                    "description": item["snippet"].get("description", "")[:300],
                    "tags": item["snippet"].get("tags", []),
                    "category_id": item["snippet"].get("categoryId", ""),
                    "published_at": item["snippet"]["publishedAt"],
                    "views": int(stats.get("viewCount", 0)),
                    "likes": int(stats.get("likeCount", 0)),
                    "comments": int(stats.get("commentCount", 0)),
                    "thumbnail": item["snippet"].get("thumbnails", {}).get("high", {}).get("url", ""),
                })

            return trending

        except Exception as e:
            logger.error(f"Failed to fetch trending videos: {e}")
            return []

    def search_videos(self, query: str, max_results: int = 10) -> list[dict]:
        """Search YouTube for specific topic content."""
        try:
            resp = self.youtube.search().list(
                part="snippet",
                q=query,
                type="video",
                order="viewCount",
                maxResults=max_results,
                publishedAfter=(datetime.utcnow().replace(day=1)).strftime("%Y-%m-%dT00:00:00Z"),
            ).execute()

            results = []
            for item in resp.get("items", []):
                results.append({
                    "video_id": item["id"]["videoId"],
                    "title": item["snippet"]["title"],
                    "channel_title": item["snippet"]["channelTitle"],
                    "description": item["snippet"].get("description", ""),
                    "published_at": item["snippet"]["publishedAt"],
                    "thumbnail": item["snippet"].get("thumbnails", {}).get("high", {}).get("url", ""),
                })
            return results

        except Exception as e:
            logger.error(f"Search failed for query '{query}': {e}")
            return []

    def _parse_channel(self, item: dict) -> dict:
        """Parse a channel API response into a clean dict."""
        snippet = item["snippet"]
        stats = item.get("statistics", {})
        return {
            "channel_id": item["id"],
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "custom_url": snippet.get("customUrl", ""),
            "published_at": snippet.get("publishedAt", ""),
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "subscribers": int(stats.get("subscriberCount", 0)),
            "total_views": int(stats.get("viewCount", 0)),
            "video_count": int(stats.get("videoCount", 0)),
        }
