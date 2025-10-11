from fastapi import APIRouter, HTTPException, Body, Depends
from typing import Dict, Any, List
from ..services.contract_service import contract_service
from pydantic import BaseModel, Field

router = APIRouter()

class VerifyProofRequest(BaseModel):
    pool_id: int = Field(..., description="The pool ID")
    epoch: int = Field(..., description="The epoch number")
    index: int = Field(..., description="The index in the distribution")
    account: str = Field(..., description="The account address")
    shares: int = Field(..., description="The number of shares")
    amount: int = Field(..., description="The amount to distribute")
    proof: List[str] = Field(..., description="The merkle proof")

class VerifyProofResponse(BaseModel):
    valid: bool = Field(..., description="Whether the proof is valid")

@router.get("/pool/{pool_id}", tags=["contract"])
async def get_pool_info(pool_id: int):
    """
    Get information about a pool from the smart contract
    
    Args:
        pool_id: The ID of the pool
        
    Returns:
        Pool information
    """
    try:
        pool_info = await contract_service.get_pool_info(pool_id)
        return pool_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting pool info: {str(e)}")

@router.get("/pool/{pool_id}/epoch/{epoch}", tags=["contract"])
async def get_epoch_meta(pool_id: int, epoch: int):
    """
    Get metadata about a specific epoch in a pool
    
    Args:
        pool_id: The ID of the pool
        epoch: The epoch number
        
    Returns:
        Epoch metadata
    """
    try:
        epoch_meta = await contract_service.get_epoch_meta(pool_id, epoch)
        return epoch_meta
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting epoch meta: {str(e)}")

@router.post("/verify-proof", response_model=VerifyProofResponse, tags=["contract"])
async def verify_proof(request: VerifyProofRequest):
    """
    Verify a merkle proof for a distribution record
    
    Args:
        request: The verification request
        
    Returns:
        Whether the proof is valid
    """
    try:
        valid = await contract_service.verify_epoch_proof(
            request.pool_id,
            request.epoch,
            request.index,
            request.account,
            request.shares,
            request.amount,
            request.proof
        )
        return {"valid": valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying proof: {str(e)}")
