from typing import Dict, Any, List, Optional
from ..core.config import settings
import json
import httpx
import asyncio

class ContractService:
    """
    Service for interacting with the KolEscrow smart contract on Starknet
    """
    
    def __init__(self):
        self.contract_address = settings.kolescrow_contract_address
        # Assuming you're using a Starknet RPC provider
        self.rpc_url = "https://starknet-mainnet.public.blastapi.io"
        
    async def get_pool_info(self, pool_id: int) -> Dict[str, Any]:
        """
        Get information about a pool from the smart contract
        
        Args:
            pool_id: The ID of the pool
            
        Returns:
            Pool information as a dictionary
        """
        # Call the get_pool function on the contract
        payload = {
            "jsonrpc": "2.0",
            "method": "starknet_call",
            "params": {
                "request": {
                    "contract_address": self.contract_address,
                    "entry_point_selector": "get_pool",
                    "calldata": [str(pool_id), "0"]  # pool_id as u256 (low, high)
                },
                "block_id": "latest"
            },
            "id": 1
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.rpc_url, json=payload)
            result = response.json()
            
            if "error" in result:
                raise Exception(f"Error calling contract: {result['error']}")
                
            # Parse the response based on the PoolInfo struct in the contract
            return self._parse_pool_info(result["result"])
    
    async def get_epoch_meta(self, pool_id: int, epoch: int) -> Dict[str, Any]:
        """
        Get metadata about a specific epoch in a pool
        
        Args:
            pool_id: The ID of the pool
            epoch: The epoch number
            
        Returns:
            Epoch metadata as a dictionary
        """
        payload = {
            "jsonrpc": "2.0",
            "method": "starknet_call",
            "params": {
                "request": {
                    "contract_address": self.contract_address,
                    "entry_point_selector": "get_epoch_meta",
                    "calldata": [str(pool_id), "0", str(epoch)]  # pool_id as u256 (low, high), epoch
                },
                "block_id": "latest"
            },
            "id": 1
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.rpc_url, json=payload)
            result = response.json()
            
            if "error" in result:
                raise Exception(f"Error calling contract: {result['error']}")
                
            # Parse the response based on the EpochMeta struct in the contract
            return self._parse_epoch_meta(result["result"])
    
    async def verify_epoch_proof(
        self, 
        pool_id: int, 
        epoch: int, 
        index: int, 
        account: str, 
        shares: int, 
        amount: int, 
        proof: List[str]
    ) -> bool:
        """
        Verify a merkle proof for a distribution record
        
        Args:
            pool_id: The ID of the pool
            epoch: The epoch number
            index: The index of the record in the distribution
            account: The account address
            shares: The number of shares
            amount: The amount to distribute
            proof: The merkle proof
            
        Returns:
            True if the proof is valid, False otherwise
        """
        # Prepare the calldata
        calldata = [
            str(pool_id), "0",  # pool_id as u256 (low, high)
            str(epoch),
            str(index), "0",  # index as u256 (low, high)
            account,  # account address
            str(shares), "0",  # shares as u256 (low, high)
            str(amount), "0",  # amount as u256 (low, high)
            str(len(proof))  # proof length
        ]
        
        # Add the proof elements
        calldata.extend(proof)
        
        payload = {
            "jsonrpc": "2.0",
            "method": "starknet_call",
            "params": {
                "request": {
                    "contract_address": self.contract_address,
                    "entry_point_selector": "verify_epoch_proof",
                    "calldata": calldata
                },
                "block_id": "latest"
            },
            "id": 1
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.rpc_url, json=payload)
            result = response.json()
            
            if "error" in result:
                raise Exception(f"Error calling contract: {result['error']}")
                
            # The result should be a boolean (1 for true, 0 for false)
            return result["result"] == "1"
    
    def _parse_pool_info(self, result: List[str]) -> Dict[str, Any]:
        """
        Parse the result of a get_pool call into a dictionary
        
        Args:
            result: The raw result from the contract call
            
        Returns:
            Parsed pool information
        """
        # Based on the PoolInfo struct in the contract
        return {
            "brand": result[0],
            "token": result[1],
            "attester_pubkey": result[2],
            "status": int(result[3]),
            "funded_amount": int(result[4]),
            "total_claimed_amount": int(result[5]),
            "current_epoch": int(result[6]),
            "allocated_shares": int(result[7]),
            "unit_k": int(result[8]),
            "merkle_root": result[9],
            "deadline_ts": int(result[10]),
            "refund_after_ts": int(result[11])
        }
    
    def _parse_epoch_meta(self, result: List[str]) -> Dict[str, Any]:
        """
        Parse the result of a get_epoch_meta call into a dictionary
        
        Args:
            result: The raw result from the contract call
            
        Returns:
            Parsed epoch metadata
        """
        # Based on the EpochMeta struct in the contract
        return {
            "merkle_root": result[0],
            "total_shares": int(result[1]),
            "unit_k": int(result[2]),
            "deadline_ts": int(result[3]),
            "refund_after_ts": int(result[4]),
            "claimed_amount": int(result[5]),
            "status": int(result[6])
        }

# Create a singleton instance
contract_service = ContractService()
