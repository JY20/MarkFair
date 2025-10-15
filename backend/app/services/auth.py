from dataclasses import dataclass
import logging
from functools import lru_cache
from typing import Any, Dict, Optional
import jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from ..core.config import settings


security = HTTPBearer(auto_error=False)
logger = logging.getLogger("auth")


@dataclass
class AuthenticatedUser:
    sub: str
    claims: Dict[str, Any]


@lru_cache(maxsize=1)
def get_jwk_client() -> PyJWKClient:
    return PyJWKClient(settings.clerk_jwks_url)


def verify_and_decode_token(token: str) -> Dict[str, Any]:
    jwk_client = get_jwk_client()
    signing_key = jwk_client.get_signing_key_from_jwt(token).key
    decode_kwargs: Dict[str, Any] = {
        "algorithms": ["RS256"],
        "issuer": settings.clerk_issuer,
    }
    # Some Clerk templates may not include an 'aud' claim. Only enforce if provided.
    if getattr(settings, "clerk_audience", None):
        decode_kwargs["audience"] = settings.clerk_audience
    decoded = jwt.decode(token, signing_key, **decode_kwargs)
    return decoded


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_test_user_id: Optional[str] = Header(None)
) -> AuthenticatedUser:
    # Test mode: bypass JWT and use X-Test-User-ID header
    if settings.test_mode and x_test_user_id:
        logger.warning("⚠️  TEST MODE: Bypassing JWT auth, using X-Test-User-ID=%s", x_test_user_id)
        return AuthenticatedUser(sub=x_test_user_id, claims={"sub": x_test_user_id, "test_mode": True})
    
    # Production mode: validate JWT
    if credentials is None or not credentials.scheme.lower() == "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = credentials.credentials
    try:
        claims = verify_and_decode_token(token)
    except Exception as e:
        logger.exception("JWT verification failed: %s", str(e))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: sub missing")

    return AuthenticatedUser(sub=sub, claims=claims)


