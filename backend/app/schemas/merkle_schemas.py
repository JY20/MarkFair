from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DistributionRecord(BaseModel):
    account: str = Field(..., description="Account address")
    shares: int = Field(..., description="Number of shares")
    amount: int = Field(..., description="Amount to distribute")

class MerkleRequest(BaseModel):
    pool_id: int = Field(..., description="ID of the mining pool")
    epoch: int = Field(..., description="Epoch number")
    distribution_data: List[DistributionRecord] = Field(..., description="List of distribution records")

class MerkleResponse(BaseModel):
    merkle_root: str = Field(..., description="The merkle root hash")
    leaf_hashes: List[str] = Field(..., description="List of leaf hashes")

class ProofElement(BaseModel):
    position: str = Field(..., description="Position ('left' or 'right')")
    hash: str = Field(..., description="Hash value")

class VerifyRequest(BaseModel):
    account: str = Field(..., description="Account address")
    amount: int = Field(..., description="Amount distributed")
    shares: int = Field(..., description="Number of shares")
    proof: List[ProofElement] = Field(..., description="Merkle proof elements")
    merkle_root: str = Field(..., description="Merkle root to verify against")
    pool_id: int = Field(..., description="ID of the mining pool")
    epoch: int = Field(..., description="Epoch number")
    index: int = Field(..., description="Index in the distribution")

class VerifyResponse(BaseModel):
    valid: bool = Field(..., description="Whether the proof is valid")
