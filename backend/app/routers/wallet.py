from fastapi import APIRouter, Depends

from ..schemas.wallet import WalletLinkRequest
from ..services.wallet_service import link_wallet_to_user
from ..services.auth import get_current_user


router = APIRouter(tags=["wallet"])


@router.post("/link")
def link_wallet(req: WalletLinkRequest, user=Depends(get_current_user)) -> dict:
    link_wallet_to_user(
        user_id=user.sub,
        wallet_address=req.wallet_address,
        google_access_token=req.google_access_token,
    )
    return {"linked": True}


