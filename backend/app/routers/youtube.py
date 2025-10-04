from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas.youtube import VideoAddRequest, VideoResponse, UserTypeSetRequest
from ..services.youtube_service import (
    add_video_for_user,
    get_user_videos,
    set_user_type,
    get_user_profile,
)
from ..services.auth import get_current_user


router = APIRouter(tags=["youtube"])


@router.post("/videos")
def add_video(req: VideoAddRequest, user=Depends(get_current_user)) -> dict:
    try:
        return add_video_for_user(user_id=user.sub, video_url=str(req.video_url))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("/videos", response_model=List[VideoResponse])
def list_videos(user=Depends(get_current_user)):
    return get_user_videos(user_id=user.sub)


@router.post("/user-type")
def set_user_type_route(req: UserTypeSetRequest, user=Depends(get_current_user)) -> dict:
    set_user_type(user_id=user.sub, user_type=req.user_type)
    return {"ok": True}


@router.get("/me")
def get_me(user=Depends(get_current_user)) -> dict:
    return get_user_profile(user_id=user.sub)


