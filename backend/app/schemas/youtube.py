from typing import Optional, Literal
from pydantic import BaseModel, AnyUrl


class VideoAddRequest(BaseModel):
    video_url: AnyUrl


class VideoResponse(BaseModel):
    id: int
    video_url: AnyUrl
    likes: int
    views: int
    subscribers_at_add: int
    subscribers_current: int | None = None
    channel_id: Optional[str] = None
    channel_title: Optional[str] = None


class UserTypeSetRequest(BaseModel):
    user_type: Literal['KOL', 'Advertiser']


