from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from ..db.session import get_db_session
from ..schemas.pool_schemas import ProofResponse, ProofRequest
from ..services.auth import get_current_user, AuthenticatedUser
from ..utils.merkle_utils import generate_merkle_proof

router = APIRouter()


@router.get("/{pool_id}/proof", response_model=ProofResponse)
async def get_user_proof(
    pool_id: str = Path(..., description="Pool ID"),
    epoch: Optional[int] = Query(None, description="Epoch number"),
    user: str = Query(..., description="User account address"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Get merkle proof for a user in a specific pool and epoch
    """
    try:
        # Generate the merkle proof for the user in the specified pool and epoch
        proof, leaf = generate_merkle_proof(
            pool_id=pool_id,
            epoch=epoch,
            user_address=user,
            db=db
        )
        
        return ProofResponse(
            proof=proof,
            leaf=leaf,
            valid=True
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to generate proof: {str(e)}")
