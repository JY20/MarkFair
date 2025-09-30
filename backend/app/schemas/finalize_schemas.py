from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class DomainHashRequest(BaseModel):
    pool_id: int = Field(..., description="The pool ID")
    epoch: int = Field(..., description="The epoch number")
    merkle_root: str = Field(..., description="The merkle root hash")
    total_shares: int = Field(..., description="Total shares in the distribution")
    unit_k: int = Field(..., description="Unit k value (conversion factor)")
    deadline_ts: int = Field(..., description="Deadline timestamp")
    nonce: int = Field(..., description="Nonce value to prevent replay attacks")

class SignRequest(BaseModel):
    message_hash: str = Field(..., description="The hash to sign")
    private_key: Optional[str] = Field(None, description="The private key to sign with (if not provided, default will be used)")

class FinalizeEpochRequest(BaseModel):
    pool_id: int = Field(..., description="The pool ID")
    epoch: int = Field(..., description="The epoch number")
    merkle_root: str = Field(..., description="The merkle root hash")
    total_shares: int = Field(..., description="Total shares in the distribution")
    unit_k: int = Field(..., description="Unit k value (conversion factor)")
    deadline_ts: int = Field(..., description="Deadline timestamp")
    nonce: int = Field(..., description="Nonce value to prevent replay attacks")
    private_key: Optional[str] = Field(None, description="The private key to sign with (if not provided, default will be used)")
