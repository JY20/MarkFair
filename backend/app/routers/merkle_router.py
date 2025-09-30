from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
from ..schemas.merkle_schemas import (
    DistributionRecord, MerkleRequest, MerkleResponse,
    VerifyRequest, VerifyResponse, ProofElement
)
from ..utils.merkle_utils import (
    secure_hash, leaf_hash, build_merkle_tree, verify_merkle_proof
)

router = APIRouter()

@router.post("/merkle/generate", response_model=MerkleResponse, tags=["merkle"])
async def generate_merkle_tree(request: MerkleRequest):
    """
    Generate a merkle tree from distribution data.
    
    This endpoint takes a list of distribution records and generates a merkle tree,
    returning the merkle root and the list of leaf hashes.
    """
    try:
        # Convert Pydantic models to dictionaries
        distribution_data = [record.model_dump() for record in request.distribution_data]
        
        # Sort the data (as required by the merkle tree algorithm)
        sorted_data = sorted(distribution_data, key=lambda x: x['account'])
        
        # Build the merkle tree
        merkle_root, leaf_hashes = build_merkle_tree(
            sorted_data, 
            request.pool_id, 
            request.epoch
        )
        
        return {
            "merkle_root": merkle_root,
            "leaf_hashes": leaf_hashes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating merkle tree: {str(e)}")

@router.post("/merkle/verify", response_model=VerifyResponse, tags=["merkle"])
async def verify_merkle_inclusion(request: VerifyRequest):
    """
    Verify that a distribution record is included in the merkle tree.
    
    This endpoint takes a distribution record and a merkle proof,
    and verifies that the record is included in the merkle tree
    with the given merkle root.
    """
    try:
        # Convert proof elements to the format expected by the verify function
        proof = [{"position": elem.position, "hash": elem.hash} for elem in request.proof]
        
        # Verify the proof
        valid = verify_merkle_proof(
            request.account,
            request.amount,
            request.shares,
            proof,
            request.merkle_root,
            request.pool_id,
            request.epoch,
            request.index
        )
        
        return {"valid": valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying merkle proof: {str(e)}")

@router.post("/merkle/hash/secure", tags=["merkle"])
async def create_secure_hash(
    leaf_tag: str = Body(...),
    pool_id: int = Body(...),
    epoch: int = Body(...),
    index: int = Body(...),
    account: str = Body(...),
    shares: int = Body(...),
    amount: int = Body(...),
    count: int = Body(7)
):
    """
    Create a secure hash for a leaf node.
    
    This endpoint creates a secure hash for a leaf node in the merkle tree,
    using the provided parameters.
    """
    try:
        hash_value = secure_hash(
            leaf_tag, pool_id, epoch, index, account, shares, amount, count
        )
        return {"hash": hash_value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating secure hash: {str(e)}")

@router.post("/merkle/hash/leaf", tags=["merkle"])
async def create_leaf_hash(
    account: str = Body(...),
    secure_hash: str = Body(...),
    count: int = Body(2)
):
    """
    Create a leaf hash combining account and secure hash.
    
    This endpoint creates a hash for a leaf node by combining
    the account address and a previously generated secure hash.
    """
    try:
        hash_value = leaf_hash(account, secure_hash, count)
        return {"hash": hash_value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating leaf hash: {str(e)}")
