from typing import Optional
from pydantic import BaseModel, Field


class ProofResponse(BaseModel):
    """Response model for proof endpoint"""
    proof: list[str] = Field(description="Merkle proof for the user in the given pool")
    leaf: str = Field(description="Leaf value for the user")
    valid: bool = Field(description="Whether the proof is valid")


class ProofRequest(BaseModel):
    """Request parameters for proof endpoint"""
    epoch: Optional[int] = Field(default=None, description="Epoch number")
    user: str = Field(description="User account address")
