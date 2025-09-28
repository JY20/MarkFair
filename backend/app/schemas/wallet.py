from typing import Optional
from pydantic import BaseModel


class WalletLinkRequest(BaseModel):
    wallet_address: str
    google_access_token: Optional[str] = None


