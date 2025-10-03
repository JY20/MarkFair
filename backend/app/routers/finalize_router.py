from fastapi import APIRouter, HTTPException, Body, Depends
from typing import Dict, Any
import os
from ..schemas.finalize_schemas import (
    DomainHashRequest, SignRequest, FinalizeEpochRequest
)
from ..utils.domain_hash_utils import (
    domain_hash_finalize, ecdsa_sign, finalize_epoch as finalize_epoch_util
)

router = APIRouter()

# Get the private key from environment variable (for demo purposes)
# In production, you would use a more secure method of key management
DEFAULT_PRIVATE_KEY = os.environ.get("SIGNER_PRIVATE_KEY", "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")

@router.post("/domain-hash", tags=["finalize"])
async def calculate_domain_hash(request: DomainHashRequest):
    """
    Calculate the domain hash for finalizing an epoch.
    
    This endpoint calculates the domain hash using the provided parameters,
    which is needed for the finalize_epoch function.
    """
    try:
        hash_value = domain_hash_finalize(
            request.pool_id,
            request.epoch,
            request.merkle_root,
            request.total_shares,
            request.unit_k,
            request.deadline_ts,
            request.nonce
        )
        return {"domain_hash": hash_value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating domain hash: {str(e)}")

@router.post("/sign", tags=["finalize"])
async def sign_message(request: SignRequest):
    """
    Sign a message hash using ECDSA.
    
    This endpoint signs a message hash using the provided private key
    or the default private key if none is provided.
    """
    try:
        private_key = request.private_key or DEFAULT_PRIVATE_KEY
        r, s = ecdsa_sign(request.message_hash, private_key)
        return {"r": r, "s": s}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error signing message: {str(e)}")

@router.post("/finalize-epoch", tags=["finalize"])
async def finalize_epoch(request: FinalizeEpochRequest):
    """
    Finalize an epoch by generating the domain hash and signing it.
    
    This endpoint calculates the domain hash for the provided parameters,
    signs it using the provided private key (or default if none is provided),
    and returns the result.
    """
    try:
        private_key = request.private_key or DEFAULT_PRIVATE_KEY
        result = finalize_epoch_util(
            request.pool_id,
            request.epoch,
            request.merkle_root,
            request.total_shares,
            request.unit_k,
            request.deadline_ts,
            request.nonce,
            private_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finalizing epoch: {str(e)}")
