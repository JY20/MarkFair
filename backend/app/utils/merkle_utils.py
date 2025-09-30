import hashlib
from typing import List, Dict, Any, Tuple
import json

def secure_hash(leaf_tag: str, pool_id: int, epoch: int, index: int, 
                account: str, shares: int, amount: int, count: int = 7) -> str:
    """
    Creates a secure hash for a leaf node in the merkle tree.
    
    Args:
        leaf_tag: Tag identifying this as a leaf node
        pool_id: ID of the mining pool
        epoch: Epoch number
        index: Index in the distribution
        account: Account address
        shares: Number of shares
        amount: Amount to distribute
        count: Number of elements in the hash (default: 7)
    
    Returns:
        A secure hash string
    """
    # Combine all elements into a string
    elements = [leaf_tag, str(pool_id), str(epoch), str(index), 
                account, str(shares), str(amount)]
    
    # Create a hash of the combined elements
    combined = ",".join(elements[:count])
    
    # Use SHA-256 for the initial hash
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    return hash_obj.hexdigest()

def leaf_hash(account: str, secure_hash: str, count: int = 2) -> str:
    """
    Creates a hash for a leaf combining account and secure hash.
    
    Args:
        account: Account address
        secure_hash: The secure hash generated earlier
        count: Number of elements in the hash (default: 2)
    
    Returns:
        A hash string for the leaf
    """
    elements = [account, secure_hash]
    combined = ",".join(elements[:count])
    
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    return hash_obj.hexdigest()

def pedersen_hash(left: str, right: str) -> str:
    """
    Simulates a Pedersen hash function for combining two hashes.
    
    Note: This is a simplified version. In a real implementation,
    you would use a cryptographic library that implements Pedersen commitments.
    
    Args:
        left: Left child hash
        right: Right child hash
    
    Returns:
        Combined hash
    """
    # In a real implementation, you would use an actual Pedersen hash
    # This is just a placeholder using SHA-256
    combined = left + right
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    return hash_obj.hexdigest()

def sort_distribution_data(distribution_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sorts the distribution data by account address.
    
    Args:
        distribution_data: List of distribution records
        
    Returns:
        Sorted distribution data
    """
    return sorted(distribution_data, key=lambda x: x['account'])

def build_merkle_tree(sorted_data: List[Dict[str, Any]], pool_id: int, epoch: int) -> Tuple[str, List[str]]:
    """
    Builds a merkle tree from sorted distribution data.
    
    Args:
        sorted_data: Sorted list of distribution records
        pool_id: ID of the mining pool
        epoch: Epoch number
        
    Returns:
        Tuple of (merkle_root, leaf_hashes)
    """
    if not sorted_data:
        return "", []
    
    # Generate leaf hashes
    leaves = []
    for i, item in enumerate(sorted_data):
        s_hash = secure_hash(
            "LEAF_TAG", 
            pool_id, 
            epoch, 
            i, 
            item['account'], 
            item['shares'], 
            item['amount']
        )
        l_hash = leaf_hash(item['account'], s_hash)
        leaves.append(l_hash)
    
    # If we have an odd number of leaves, duplicate the last one
    if len(leaves) % 2 == 1:
        leaves.append(leaves[-1])
    
    # Build the tree
    tree_level = leaves.copy()
    while len(tree_level) > 1:
        next_level = []
        for i in range(0, len(tree_level), 2):
            if i + 1 < len(tree_level):
                combined_hash = pedersen_hash(tree_level[i], tree_level[i+1])
                next_level.append(combined_hash)
            else:
                # If we have an odd number at this level, promote the node
                next_level.append(tree_level[i])
        tree_level = next_level
    
    # The root is the only element left
    merkle_root = tree_level[0] if tree_level else ""
    
    return merkle_root, leaves

def verify_merkle_proof(account: str, amount: int, shares: int, proof: List[Dict[str, str]], 
                       merkle_root: str, pool_id: int, epoch: int, index: int) -> bool:
    """
    Verifies that a distribution record is part of the merkle tree.
    
    Args:
        account: Account address to verify
        amount: Amount distributed
        shares: Number of shares
        proof: List of proof elements (each with 'position' and 'hash')
        merkle_root: The merkle root to verify against
        pool_id: ID of the mining pool
        epoch: Epoch number
        index: Index in the distribution
        
    Returns:
        True if the proof is valid, False otherwise
    """
    # Calculate the leaf hash for this account
    s_hash = secure_hash("LEAF_TAG", pool_id, epoch, index, account, shares, amount)
    current_hash = leaf_hash(account, s_hash)
    
    # Apply each proof element
    for element in proof:
        if element['position'] == 'left':
            current_hash = pedersen_hash(element['hash'], current_hash)
        else:  # right
            current_hash = pedersen_hash(current_hash, element['hash'])
    
    # Check if we've arrived at the merkle root
    return current_hash == merkle_root
