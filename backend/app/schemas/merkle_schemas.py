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
    matches_contract: Optional[bool] = Field(None, description="Whether the merkle root matches the one in the contract")

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

class ContractVerifyRequest(BaseModel):
    pool_id: int = Field(..., description="ID of the mining pool")
    epoch: int = Field(..., description="Epoch number")
    index: int = Field(..., description="Index in the distribution")
    account: str = Field(..., description="Account address")
    shares: int = Field(..., description="Number of shares")
    amount: int = Field(..., description="Amount distributed")
    proof: List[str] = Field(..., description="Merkle proof elements as raw hex strings")

class ContractVerifyResponse(BaseModel):
    valid: bool = Field(..., description="Whether the proof is valid according to the contract")
    
class MerkleProofRequest(BaseModel):
    pool_id: int = Field(..., description="ID of the mining pool")
    epoch: int = Field(..., description="Epoch number")
    account: str = Field(..., description="Account address")

class MerkleProofResponse(BaseModel):
    proof: List[str] = Field(..., description="Merkle proof elements as raw hex strings")
    index: int = Field(..., description="Index in the distribution")
    shares: int = Field(..., description="Number of shares")
    amount: int = Field(..., description="Amount distributed")
    valid: bool = Field(..., description="Whether the proof is valid")