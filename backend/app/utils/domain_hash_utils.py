import hashlib
from typing import Tuple, Union, List, Dict, Any
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
import json
from ..core.config import settings

def domain_hash_finalize(
    pool_id: int, 
    epoch: int, 
    merkle_root: str, 
    total_shares: int, 
    unit_k: int, 
    deadline_ts: int, 
    nonce: int
) -> str:
    """
    Calculates the domain hash for finalizing an epoch.
    
    This function implements the domain_hash_finalize function from the smart contract.
    
    Args:
        pool_id: The pool ID
        epoch: The epoch number
        merkle_root: The merkle root hash
        total_shares: Total shares in the distribution
        unit_k: Unit k value (conversion factor)
        deadline_ts: Deadline timestamp
        nonce: Nonce value to prevent replay attacks
        
    Returns:
        The domain hash as a hexadecimal string
    """
    # Convert merkle_root from hex to int if it's in hex format
    if isinstance(merkle_root, str) and merkle_root.startswith('0x'):
        merkle_root_int = int(merkle_root, 16)
    else:
        merkle_root_int = int(merkle_root)
    
    # Create array of elements similar to the contract implementation
    elements = [
        'KOL_FINALIZE',
        # Use the actual contract address from config
        settings.kolescrow_contract_address,  
        pool_id,
        epoch,
        merkle_root_int,
        total_shares,
        unit_k,
        deadline_ts,
        nonce
    ]
    
    # Convert elements to strings and join them
    elements_str = [str(element) for element in elements]
    combined = ",".join(elements_str)
    
    # Hash the combined string
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    return hash_obj.hexdigest()

def ecdsa_sign(
    message_hash: str, 
    private_key: str
) -> Tuple[str, str]:
    """
    Signs a message hash using ECDSA.
    
    Args:
        message_hash: The hash to sign
        private_key: The private key to sign with
        
    Returns:
        A tuple of (r, s) signature components
    """
    # Remove '0x' prefix if present
    if private_key.startswith('0x'):
        private_key = private_key[2:]
    
    # Create an Account object from the private key
    account = Account.from_key(private_key)
    
    # Create a message object
    message = encode_defunct(hexstr=message_hash)
    
    # Sign the message
    signed_message = Account.sign_message(message, private_key)
    
    # Extract r and s values
    r = hex(signed_message.r)
    s = hex(signed_message.s)
    
    return (r, s)

def finalize_epoch(
    pool_id: int,
    epoch: int,
    merkle_root: str,
    total_shares: int,
    unit_k: int,
    deadline_ts: int,
    nonce: int,
    private_key: str
) -> Dict[str, Any]:
    """
    Finalizes an epoch by generating the domain hash and signing it.
    
    Args:
        pool_id: The pool ID
        epoch: The epoch number
        merkle_root: The merkle root hash
        total_shares: Total shares in the distribution
        unit_k: Unit k value (conversion factor)
        deadline_ts: Deadline timestamp
        nonce: Nonce value to prevent replay attacks
        private_key: The private key to sign with
        
    Returns:
        A dictionary containing the message hash, signature components, and all input parameters
    """
    # Calculate the domain hash
    expected = domain_hash_finalize(
        pool_id, 
        epoch, 
        merkle_root, 
        total_shares, 
        unit_k, 
        deadline_ts, 
        nonce
    )
    
    # Sign the domain hash
    r, s = ecdsa_sign(expected, private_key)
    
    # Return the result
    return {
        "pool_id": pool_id,
        "epoch": epoch,
        "merkle_root": merkle_root,
        "total_shares": total_shares,
        "unit_k": unit_k,
        "deadline_ts": deadline_ts,
        "msg_hash": expected,
        "r": r,
        "s": s
    }
