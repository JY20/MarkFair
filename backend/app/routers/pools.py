from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from ..schemas.pool import PoolCreateRequest, PoolCreateResponse
from ..services.pool_service import (
    create_pool_db_then_chain,
    process_pool_creation,
    get_pool_status,
    list_all_pools,
)
from ..services.auth import get_current_user
from ..core.config import settings


router = APIRouter(tags=["pools"], prefix="/api/pools")


@router.post("", response_model=PoolCreateResponse)
def create_pool(req: PoolCreateRequest, bg: BackgroundTasks, user=Depends(get_current_user)):
    try:
        pool_id = create_pool_db_then_chain(
            token=req.token,
            brand=req.brand,
            deadline_ts=req.deadline_ts,
            refund_after_ts=req.refund_after_ts,
            attester_pubkey=int(settings.attester_pubkey, 16) if settings.attester_pubkey else 0,
            creator_sub=user.sub,
            task_title=req.task_title,
            description=req.description,
        )
        bg.add_task(
            process_pool_creation,
            int(pool_id),
            req.token,
            req.brand,
            req.deadline_ts,
            req.refund_after_ts,
            int(settings.attester_pubkey, 16) if settings.attester_pubkey else 0,
        )
        return PoolCreateResponse(pool_id=pool_id, tx_hash="", message="submitted")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/all")
def list_every_pool(user=Depends(get_current_user)):
    # Restrict to KOL users only
    # Minimal check: rely on user profile stored in DB; fetch via service to verify user_type
    from ..db.session import get_db_session
    from ..db.models import User

    with next(get_db_session()) as db:  # type: ignore
        u = db.query(User).filter(User.sub == user.sub).first()
        if not u or (u.user_type or "").upper() != "KOL":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only KOL can access this endpoint")
    return list_all_pools()


@router.get("/{pool_id}")
def get_pool(pool_id: int, user=Depends(get_current_user)):
    return get_pool_status(pool_id)


@router.get("")
def list_my_pools(user=Depends(get_current_user)):
    from ..services.pool_service import list_pools_for_user

    return list_pools_for_user(user.sub)


