// Starknet HTLC Contract Configuration
export const hash = '0x05c98aace18ddaed01ac6335b314dd35e5c311455acc80a2658b6c4af5e88a6e';
export const STARKNET_HTLC_ADDRESS = '0x02ebabddc3d08f47b1bc9bb6cd0e9812f073dd8d75319bbf02da88f669ac';

// Token addresses on Starknet Sepolia
export const ETH_TOKEN_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'; // ETH token on Starknet
export const STRK_TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'; // STRK token on Starknet Sepolia

export const STARKNET_HTLC_ABI = [
  {
    "type": "function",
    "name": "create_htlc", 
    "inputs": [
      {"name": "hashlock", "type": "core::felt252"},
      {"name": "recipient", "type": "core::starknet::contract_address::ContractAddress"},
      {"name": "token", "type": "core::starknet::contract_address::ContractAddress"},
      {"name": "amount", "type": "core::integer::u256"},
      {"name": "timelock", "type": "core::integer::u64"}
    ],
    "outputs": [{"type": "core::felt252"}],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {"name": "htlc_id", "type": "core::felt252"},
      {"name": "secret", "type": "core::felt252"}
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function", 
    "name": "refund",
    "inputs": [{"name": "htlc_id", "type": "core::felt252"}],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "get_htlc",
    "inputs": [{"name": "htlc_id", "type": "core::felt252"}],
    "outputs": [{
      "type": "quantmart_contract::StarknetHTLC::HTLC"
    }],
    "state_mutability": "view"
  },
  {
    "type": "function",
    "name": "get_balance",
    "inputs": [
      {"name": "token_address", "type": "core::starknet::contract_address::ContractAddress"},
      {"name": "user_address", "type": "core::starknet::contract_address::ContractAddress"}
    ],
    "outputs": [{"type": "core::integer::u256"}],
    "state_mutability": "view"
  }
];

export const HTLC_EVENTS = {
  HTLCCreated: 'quantmart_contract::StarknetHTLC::StarknetHTLC::HTLCCreated',
  HTLCWithdrawn: 'quantmart_contract::StarknetHTLC::StarknetHTLC::HTLCWithdrawn', 
  HTLCRefunded: 'quantmart_contract::StarknetHTLC::StarknetHTLC::HTLCRefunded'
};

// ERC20 ABI for token operations (minimal version for STRK token interactions)
export const ERC20_ABI = [
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {"name": "recipient", "type": "core::starknet::contract_address::ContractAddress"},
      {"name": "amount", "type": "core::integer::u256"}
    ],
    "outputs": [{"type": "core::bool"}],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {"name": "account", "type": "core::starknet::contract_address::ContractAddress"}
    ],
    "outputs": [{"type": "core::integer::u256"}],
    "state_mutability": "view"
  }
];

// Helper function to format claim data for UI
export const formatClaimData = (claimResult) => {
  return {
    success: claimResult.success,
    transactionHash: claimResult.transactionHash,
    amount: claimResult.amount,
    tokenSymbol: 'STRK',
    tokenAddress: STRK_TOKEN_ADDRESS,
    timestamp: new Date().toISOString(),
    status: claimResult.isMocked ? 'mocked' : 'pending'
  };
};