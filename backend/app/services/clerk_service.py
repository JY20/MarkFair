from typing import Optional

import httpx

from ..core.config import settings


def get_google_access_token_for_user(user_id: str) -> Optional[str]:
    if not settings.clerk_secret_key:
        return None
    url = f"https://api.clerk.com/v1/users/{user_id}/oauth_access_tokens/oauth_google"
    headers = {"Authorization": f"Bearer {settings.clerk_secret_key}"}
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code != 200:
                return None
            data = resp.json()
            # data is array of tokens, pick the first (most recent)
            if isinstance(data, list) and data:
                token_obj = data[0]
                return token_obj.get("token")
            return None
    except Exception:
        return None


