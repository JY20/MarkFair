from fastapi import APIRouter, Depends

from ..schemas.user import UserTypeSetRequest, UserTypeResponse
from ..services.auth import get_current_user
from ..services.youtube_service import set_user_type, get_user_profile


router = APIRouter(tags=["user"], prefix="/api/user")


@router.post("/type", response_model=UserTypeResponse)
def set_type(req: UserTypeSetRequest, user=Depends(get_current_user)) -> dict:
    set_user_type(user_id=user.sub, user_type=req.user_type)
    return {"user_type": req.user_type}


@router.get("/me")
def me(user=Depends(get_current_user)) -> dict:
    return get_user_profile(user_id=user.sub)


