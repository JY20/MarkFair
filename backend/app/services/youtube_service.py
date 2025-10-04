from __future__ import annotations

from datetime import datetime, timedelta
from typing import List

from sqlalchemy.orm import Session

from ..core.config import settings
from ..db.models import User, Video
from ..db.session import get_db_session
from ..utils.youtube_client import (
    extract_video_id_from_url,
    fetch_channel_stats,
    fetch_video_details,
)


def get_or_create_user_by_sub(db: Session, user_sub: str) -> User:
    user = db.query(User).filter(User.sub == user_sub).first()
    if user is None:
        user = User(sub=user_sub)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def add_video_for_user(user_id: str, video_url: str) -> dict:
    with next(get_db_session()) as db:  # type: ignore
        user = get_or_create_user_by_sub(db, user_id)
        video_id = extract_video_id_from_url(video_url)
        if video_id is None:
            raise ValueError("Invalid YouTube URL")

        # Fetch video details (includes channelId and channelTitle)
        details = fetch_video_details(settings.youtube_api_key, video_id)

        # Require ownership: user's linked channel must match the video's channelId
        if not user.youtube_channel_id:
            raise ValueError("Please link your YouTube channel first")
        if details.get("channelId") != user.youtube_channel_id:
            raise ValueError("Please add your own video (channel mismatch)")

        # Optional: capture subscribers at add time from the user's channel
        subscribers = 0
        channel_stats = fetch_channel_stats(settings.youtube_api_key, user.youtube_channel_id)
        subscribers = channel_stats.get("subscriberCount", 0)
        stats = {"likeCount": details.get("likeCount", 0), "viewCount": details.get("viewCount", 0)}
        now = datetime.utcnow()
        video = Video(
            user_id=user.id,
            video_url=video_url,
            likes=stats.get("likeCount", 0),
            views=stats.get("viewCount", 0),
            subscribers_at_add=subscribers,
            yt_channel_id=details.get("channelId"),
            yt_channel_title=details.get("channelTitle"),
            last_refreshed_at=now,
            subscribers_current=subscribers,
        )
        db.add(video)
        db.commit()
        return {
            "id": video.id,
            "video_url": video.video_url,
            "likes": video.likes,
            "views": video.views,
            "subscribers": subscribers,
            "channel_id": video.yt_channel_id,
            "channel_title": video.yt_channel_title,
        }


def get_user_videos(user_id: str) -> List[dict]:
    with next(get_db_session()) as db:  # type: ignore
        user = get_or_create_user_by_sub(db, user_id)
        videos = db.query(Video).filter(Video.user_id == user.id).order_by(Video.id.desc()).all()

        # refresh any stale entries (> 1 hour old)
        threshold = datetime.utcnow() - timedelta(hours=1)
        dirty = False
        for v in videos:
            if v.last_refreshed_at is None or v.last_refreshed_at < threshold:
                vid = extract_video_id_from_url(v.video_url)
                if not vid:
                    continue
                details = fetch_video_details(settings.youtube_api_key, vid)
                # Update stats
                v.likes = details.get("likeCount", v.likes)
                v.views = details.get("viewCount", v.views)
                # Update channel info if changed
                if details.get("channelTitle"):
                    v.yt_channel_title = details.get("channelTitle")
                # Update subscribers (from user's linked channel)
                if user.youtube_channel_id:
                    ch = fetch_channel_stats(settings.youtube_api_key, user.youtube_channel_id)
                    v.subscribers_current = ch.get("subscriberCount", v.subscribers_current or 0)
                v.last_refreshed_at = datetime.utcnow()
                db.add(v)
                dirty = True
        if dirty:
            db.commit()
        return [
            {
                "id": v.id,
                "video_url": v.video_url,
                "likes": v.likes,
                "views": v.views,
                "subscribers_at_add": v.subscribers_at_add,
                "subscribers_current": v.subscribers_current if v.subscribers_current is not None else v.subscribers_at_add,
                "channel_id": v.yt_channel_id,
                "channel_title": v.yt_channel_title,
            }
            for v in videos
        ]


def set_user_type(user_id: str, user_type: str) -> None:
    with next(get_db_session()) as db:  # type: ignore
        user = get_or_create_user_by_sub(db, user_id)
        user.user_type = user_type
        db.add(user)
        db.commit()


def get_user_profile(user_id: str) -> dict:
    with next(get_db_session()) as db:  # type: ignore
        user = get_or_create_user_by_sub(db, user_id)
        return {"user_type": user.user_type}


