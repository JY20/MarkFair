from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Dict, Any, Optional
from ..schemas.merkle_schemas import (
    DistributionRecord, MerkleRequest, MerkleResponse,
    VerifyRequest, VerifyResponse, ProofElement,
    ContractVerifyRequest, ContractVerifyResponse,
    MerkleProofRequest, MerkleProofResponse
)
from ..utils.merkle_utils import (
    secure_hash, leaf_hash, build_merkle_tree, verify_merkle_proof,
    generate_merkle_proof
)
from ..services.contract_service import contract_service

router = APIRouter(tags=["merkle"])

@router.post("/generate", response_model=MerkleResponse)
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

@router.post("/verify", response_model=VerifyResponse)
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

@router.post("/hash/secure")
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

@router.post("/hash/leaf")
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

@router.post("/contract-verify", response_model=ContractVerifyResponse)
async def verify_with_contract(request: ContractVerifyRequest):
    """
    Verify a merkle proof directly against the smart contract.
    
    This endpoint takes a distribution record and a merkle proof,
    and verifies it against the smart contract's verify_epoch_proof function.
    """
    try:
        # Call the contract service to verify the proof
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
        raise HTTPException(status_code=500, detail=f"Error verifying with contract: {str(e)}")

@router.post("/generate-proof", response_model=MerkleProofResponse)
async def generate_proof_for_account(request: MerkleProofRequest):
    """
    Generate a merkle proof for a specific account in a pool's epoch.
    
    This endpoint generates a proof that can be used to verify inclusion
    in the merkle tree and claim rewards from the smart contract.
    """
    try:
        # Get the epoch metadata from the contract
        epoch_meta = await contract_service.get_epoch_meta(request.pool_id, request.epoch)
        
        # Generate the proof (this would need to be implemented properly with actual distribution data)
        # For now, we'll use a mock implementation
        from sqlalchemy.orm import Session
        from ..db.session import get_db_session
        
        # This would be replaced with actual DB access in a real implementation
        db = next(get_db_session())
        proof_elements, leaf_value = generate_merkle_proof(
            str(request.pool_id), 
            request.epoch, 
            request.account, 
            db
        )
        
        # Convert proof elements to the format expected by the contract
        contract_proof = [elem for elem in proof_elements]
        
        # Verify the proof against the contract
        valid = await contract_service.verify_epoch_proof(
            request.pool_id,
            request.epoch,
            5,  # This would be the actual index from the distribution data
            request.account,
            150,  # This would be the actual shares from the distribution data
            1500,  # This would be the actual amount from the distribution data
            contract_proof
        )
        
        return {
            "proof": contract_proof,
            "index": 5,  # This would be the actual index from the distribution data
            "shares": 150,  # This would be the actual shares from the distribution data
            "amount": 1500,  # This would be the actual amount from the distribution data
            "valid": valid
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating proof: {str(e)}")

@router.get("/pool/{pool_id}/epoch/{epoch}/merkle-root")
async def get_merkle_root_from_contract(pool_id: int, epoch: int):
    """
    Get the merkle root from the smart contract for a specific pool and epoch.
    
    This endpoint retrieves the merkle root that was set during epoch finalization.
    """
    try:
        # Get the epoch metadata from the contract
        epoch_meta = await contract_service.get_epoch_meta(pool_id, epoch)
        
        return {"merkle_root": epoch_meta["merkle_root"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting merkle root: {str(e)}")

@router.post("/verify-and-generate", response_model=MerkleResponse)
async def generate_and_verify_with_contract(request: MerkleRequest):
    """
    Generate a merkle tree and verify it against the contract.
    
    This endpoint combines merkle tree generation with contract verification.
    It generates a merkle tree from the provided distribution data,
    and then verifies that the generated merkle root matches the one in the contract.
    """
    try:
        # First, generate the merkle tree
        distribution_data = [record.model_dump() for record in request.distribution_data]
        sorted_data = sorted(distribution_data, key=lambda x: x['account'])
        merkle_root, leaf_hashes = build_merkle_tree(
            sorted_data, 
            request.pool_id, 
            request.epoch
        )
        
        # Then, get the merkle root from the contract
        try:
            epoch_meta = await contract_service.get_epoch_meta(request.pool_id, request.epoch)
            contract_merkle_root = epoch_meta["merkle_root"]
            
            # Compare the generated merkle root with the one from the contract
            matches_contract = merkle_root == contract_merkle_root
            
            return {
                "merkle_root": merkle_root,
                "leaf_hashes": leaf_hashes,
                "matches_contract": matches_contract
            }
        except Exception:
            # If there's an error getting the contract data, just return the generated merkle tree
            return {
                "merkle_root": merkle_root,
                "leaf_hashes": leaf_hashes,
                "matches_contract": False
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating and verifying merkle tree: {str(e)}")
