from typing import Optional

from ..db.models import User
from ..utils.youtube_client import fetch_my_channel_id_with_token
from .clerk_service import get_google_access_token_for_user
from ..db.session import get_db_session


def link_wallet_to_user(user_id: str, wallet_address: str, google_access_token: Optional[str] = None) -> None:
    with next(get_db_session()) as db:  # type: ignore
        user = db.query(User).filter(User.sub == user_id).first()
        if user is None:
            user = User(sub=user_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        user.wallet_address = wallet_address
        if not user.youtube_channel_id:
            token_to_use = google_access_token or get_google_access_token_for_user(user_id)
            channel_id = fetch_my_channel_id_with_token(token_to_use) if token_to_use else None
            if channel_id:
                user.youtube_channel_id = channel_id
        db.add(user)
        db.commit()


