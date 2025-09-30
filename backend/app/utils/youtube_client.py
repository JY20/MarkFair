import re
from typing import Dict, Optional

import httpx


YOUTUBE_VIDEO_URL_PATTERNS = [
    r"https?://(?:www\.)?youtube\.com/watch\?v=([\w-]{11})",
    r"https?://(?:www\.)?youtu\.be/([\w-]{11})",
]


def extract_video_id_from_url(url: str) -> Optional[str]:
    for pattern in YOUTUBE_VIDEO_URL_PATTERNS:
        match = re.match(pattern, url)
        if match:
            return match.group(1)
    return None


def fetch_channel_stats(api_key: str, channel_id: str) -> Dict[str, int]:
    url = (
        "https://www.googleapis.com/youtube/v3/channels"
        f"?part=statistics&id={channel_id}&key={api_key}"
    )
    with httpx.Client(timeout=10) as client:
        res = client.get(url)
        res.raise_for_status()
        data = res.json()
        items = data.get("items", [])
        if not items:
            return {"subscriberCount": 0}
        stats = items[0].get("statistics", {})
        return {"subscriberCount": int(stats.get("subscriberCount", 0))}


def fetch_my_channel_id_with_token(google_access_token: str) -> Optional[str]:
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {"part": "id", "mine": "true"}
    headers = {"Authorization": f"Bearer {google_access_token}"}
    with httpx.Client(timeout=10) as client:
        res = client.get(url, params=params, headers=headers)
        if res.status_code != 200:
            return None
        data = res.json()
        items = data.get("items", [])
        if not items:
            return None
        return items[0].get("id")


def fetch_video_stats(api_key: str, video_id: str) -> Dict[str, int]:
    # kept for potential future background refresh; not used by current endpoints
    url = (
        "https://www.googleapis.com/youtube/v3/videos"
        f"?part=statistics&id={video_id}&key={api_key}"
    )
    with httpx.Client(timeout=10) as client:
        res = client.get(url)
        res.raise_for_status()
        data = res.json()
        items = data.get("items", [])
        if not items:
            return {"likeCount": 0, "viewCount": 0}
        stats = items[0].get("statistics", {})
        return {
            "likeCount": int(stats.get("likeCount", 0)),
            "viewCount": int(stats.get("viewCount", 0)),
        }


def fetch_video_details(api_key: str, video_id: str) -> Dict[str, Optional[str]]:
    """Return statistics and snippet basics: likeCount, viewCount, channelId, channelTitle."""
    url = (
        "https://www.googleapis.com/youtube/v3/videos"
        f"?part=statistics,snippet&id={video_id}&key={api_key}"
    )
    with httpx.Client(timeout=10) as client:
        res = client.get(url)
        res.raise_for_status()
        data = res.json()
        items = data.get("items", [])
        if not items:
            return {
                "likeCount": 0,
                "viewCount": 0,
                "channelId": None,
                "channelTitle": None,
            }
        item = items[0]
        stats = item.get("statistics", {})
        snippet = item.get("snippet", {})
        return {
            "likeCount": int(stats.get("likeCount", 0)),
            "viewCount": int(stats.get("viewCount", 0)),
            "channelId": snippet.get("channelId"),
            "channelTitle": snippet.get("channelTitle"),
        }


