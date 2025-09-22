import * as dotenv from 'dotenv';
import { Network } from './types';

dotenv.config();

// EVM Networks
export const networks: Record<string, Network> = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.drpc.org',
    factoryAddress: '0x53195abE02b3fc143D325c29F6EA2c963C8e9fc6', // StarknetEscrowFactory address
    explorerUrl: 'https://sepolia.etherscan.io'
  }
};

// StarkNet Networks
export const integrationContracts = {
  atomicSwapIntegration: "0x9FdEb27FcAb2D04930b7d861602Ea42B5d3bCA47",
  htlcFactory: "0x53195abE02b3fc143D325c29F6EA2c963C8e9fc6",
  oneInchWrapper: "0x5633F8a3FeFF2E8F615CbB17CC29946a51BaEEf9",
  network: "sepolia"
};

export const oneInchContracts = {
  oneInchWrapper: "0x5633F8a3FeFF2E8F615CbB17CC29946a51BaEEf9",
  network: "sepolia"
};

export const starknetNetworks = {
  sepolia: {
    name: 'sepolia',
    chainId: 'SN_SEPOLIA',
    nodeUrl: process.env.STARKNET_SEPOLIA_URL || 'https://starknet-testnet.drpc.org',
    explorerUrl: 'https://sepolia.starkscan.co'
  },
  goerliAlpha: {
    name: 'goerli-alpha',
    chainId: 'SN_GOERLI',
    nodeUrl: process.env.STARKNET_NODE_URL || 'https://alpha4.starknet.io',
    explorerUrl: 'https://goerli.voyager.online'
  }
};

// Default timelock settings (in seconds)
export const defaultTimelocks = {
  // Immediate withdrawal (0 delay)
  withdrawalPeriod: 0,
  
  // Safety period for refund (1 hour)
  cancellationPeriod: 3600
};

// StarkNet HTLC timelock (in seconds)
export const starknetTimelock = 86400; // 1 day in seconds

// Factory ABI (simplified for StarknetEscrowFactory)
export const factoryABI = [
  "function createSrcEscrow(tuple(bytes32 orderHash, bytes32 hashlock, uint256 maker, uint256 taker, uint256 token, uint256 amount, uint256 safetyDeposit, uint256 timelocks) immutables) external payable returns (address)",
  "function createDstEscrow(tuple(bytes32 orderHash, bytes32 hashlock, uint256 maker, uint256 taker, uint256 token, uint256 amount, uint256 safetyDeposit, uint256 timelocks) immutables) external payable returns (address)"
];

// Escrow ABI (simplified for StarknetEscrowSrc and StarknetEscrowDst)
export const escrowABI = [
  "function withdraw(bytes32 secret) external",
  "function cancel() external",
  "function hashlock() external view returns (bytes32)",
  "function orderHash() external view returns (bytes32)",
  "function maker() external view returns (address)",
  "function taker() external view returns (address)",
  "function token() external view returns (address)",
  "function amount() external view returns (uint256)",
  "function safetyDeposit() external view returns (uint256)",
  "function timelocks() external view returns (uint256)"
];

// StarkNet HTLC Contract Address
export const starknetHtlcAddress = '0xa69c1661b6d13';

// StarkNet HTLC Contract ABI (Cairo contract interface)
export const starknetHtlcABI = {
  // Function to create HTLC
  createHTLC: {
    name: 'create_htlc',
    inputs: [
      { name: 'hashlock', type: 'felt' },
      { name: 'recipient', type: 'felt' },
      { name: 'token', type: 'felt' },
      { name: 'amount', type: 'Uint256' },
      { name: 'timelock', type: 'felt' }
    ],
    outputs: [{ name: 'htlc_id', type: 'felt' }]
  },
  // Function to withdraw from HTLC
  withdraw: {
    name: 'withdraw',
    inputs: [
      { name: 'htlc_id', type: 'felt' },
      { name: 'secret', type: 'felt' }
    ],
    outputs: []
  },
  // Function to refund HTLC
  refund: {
    name: 'refund',
    inputs: [{ name: 'htlc_id', type: 'felt' }],
    outputs: []
  },
  // Function to get HTLC details
  getHTLC: {
    name: 'get_htlc',
    inputs: [{ name: 'htlc_id', type: 'felt' }],
    outputs: [
      { name: 'sender', type: 'felt' },
      { name: 'recipient', type: 'felt' },
      { name: 'token', type: 'felt' },
      { name: 'amount', type: 'Uint256' },
      { name: 'hashlock', type: 'felt' },
      { name: 'timelock', type: 'felt' },
      { name: 'withdrawn', type: 'felt' },
      { name: 'refunded', type: 'felt' },
      { name: 'created_at', type: 'felt' }
    ]
  }
}; 