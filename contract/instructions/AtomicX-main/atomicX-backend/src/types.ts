export interface Order {
  id: string;
  timestamp: number;
  maker: {
    address: string;
    chain: string;
    asset: string;
    amount: string;
  };
  taker: {
    address?: string;
    chain: string;
    asset: string;
    amount: string;
  };
  secret?: string;
  hashlock: string;
  status: OrderStatus;
  evmEscrow?: {
    address: string;
    timelocks: {
      withdrawalPeriod: number;
      cancellationPeriod: number;
    };
  };
  starknetHTLC?: {
    contractAddress: string;
    htlcId: string;
    timelock: number;
  };
}

export enum OrderStatus {
  CREATED = "CREATED",
  FILLED = "FILLED",
  EVM_ESCROW_CREATED = "EVM_ESCROW_CREATED",
  STARKNET_HTLC_FUNDED = "STARKNET_HTLC_FUNDED",
  STARKNET_CLAIMED = "STARKNET_CLAIMED",
  EVM_CLAIMED = "EVM_CLAIMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export interface Immutables {
  orderHash: string;
  hashlock: string;
  maker: string;
  taker: string;
  token: string;
  amount: string;
  safetyDeposit: string;
  timelocks: string;
}

export interface StarknetHTLC {
  contractAddress: string;
  htlcId: string;
  sender: string;
  recipient: string;
  token: string;
  amount: string;
  hashlock: string;
  timelock: number;
  withdrawn: boolean;
  refunded: boolean;
  createdAt: number;
}

export interface EVMEscrow {
  address: string;
  timelocks: {
    withdrawalPeriod: number;
    cancellationPeriod: number;
  };
}

export interface Network {
  name: string;
  chainId: number;
  rpcUrl: string;
  factoryAddress: string;
  explorerUrl: string;
}

export interface StarknetNetwork {
  name: string;
  chainId: string;
  nodeUrl: string;
  explorerUrl: string;
}

export interface StarknetAccount {
  address: string;
  privateKey: string;
  publicKey: string;
} 