import { ethers } from 'ethers';
import { Immutables, Order } from '../types';
import { networks, factoryABI, escrowABI, defaultTimelocks } from '../config';
import { packTimelocks, getProvider, getSigner } from '../utils';
import * as dotenv from 'dotenv';

dotenv.config();

// Create immutables object for escrow contract
export function createImmutables(order: Order): Immutables {
  // Create order hash from order ID
  const orderHash = ethers.utils.id(order.id);
  
  // Convert addresses to uint256
  const makerUint = ethers.BigNumber.from(order.maker.address).toString();
  const takerUint = order.taker.address 
    ? ethers.BigNumber.from(order.taker.address).toString()
    : '0';
  
  // Get token address (0 for ETH)
  const tokenAddress = order.maker.asset === '0x0000000000000000000000000000000000000000' 
    ? '0' 
    : ethers.BigNumber.from(order.maker.asset).toString();
  
  // Pack timelocks
  const packedTimelocks = packTimelocks(
    defaultTimelocks.withdrawalPeriod,
    defaultTimelocks.cancellationPeriod
  );
  
  return {
    orderHash,
    hashlock: order.hashlock,
    maker: makerUint,
    taker: takerUint,
    token: tokenAddress,
    amount: order.maker.amount,
    safetyDeposit: '0', // No safety deposit for this implementation
    timelocks: packedTimelocks
  };
}

// Create source escrow (EVM→BTC)
export async function createSourceEscrow(order: Order): Promise<string> {
  // Get provider and signer
  const provider = getProvider(networks.sepolia.rpcUrl);
  const signer = getSigner(provider);
  
  // Get factory contract
  const factory = new ethers.Contract(
    networks.sepolia.factoryAddress,
    factoryABI,
    signer
  );
  
  // Create immutables
  const immutables = createImmutables(order);
  
  // Check if we need to send ETH with the transaction
  const value = order.maker.asset === '0x0000000000000000000000000000000000000000' 
    ? ethers.BigNumber.from(order.maker.amount)
    : ethers.BigNumber.from(0);
  
  // Create escrow contract
  const tx = await factory.createSrcEscrow(
    [
      immutables.orderHash,
      immutables.hashlock,
      immutables.maker,
      immutables.taker,
      immutables.token,
      immutables.amount,
      immutables.safetyDeposit,
      immutables.timelocks
    ],
    { value }
  );
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  
  // Get escrow address from event logs
  const escrowAddress = receipt.events?.[0].args?.escrow;
  
  if (!escrowAddress) {
    throw new Error('Failed to get escrow address from transaction receipt');
  }
  
  return escrowAddress;
}

// Create destination escrow (BTC→EVM)
export async function createDestinationEscrow(order: Order): Promise<string> {
  // Get provider and signer
  const provider = getProvider(networks.sepolia.rpcUrl);
  const signer = getSigner(provider);
  
  // Get factory contract
  const factory = new ethers.Contract(
    networks.sepolia.factoryAddress,
    factoryABI,
    signer
  );
  
  // Create immutables
  const immutables = createImmutables(order);
  
  // Create escrow contract
  const tx = await factory.createDstEscrow([
    immutables.orderHash,
    immutables.hashlock,
    immutables.maker,
    immutables.taker,
    immutables.token,
    immutables.amount,
    immutables.safetyDeposit,
    immutables.timelocks
  ]);
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  
  // Get escrow address from event logs
  const escrowAddress = receipt.events?.[0].args?.escrow;
  
  if (!escrowAddress) {
    throw new Error('Failed to get escrow address from transaction receipt');
  }
  
  return escrowAddress;
}

// Withdraw from escrow using secret
export async function withdrawFromEscrow(escrowAddress: string, secret: string): Promise<ethers.ContractTransaction> {
  // Get provider and signer
  const provider = getProvider(networks.sepolia.rpcUrl);
  const signer = getSigner(provider);
  
  // Get escrow contract
  const escrow = new ethers.Contract(escrowAddress, escrowABI, signer);
  
  // Call withdraw function
  const tx = await escrow.withdraw(secret);
  
  return tx;
}

// Cancel escrow after timelock
export async function cancelEscrow(escrowAddress: string): Promise<ethers.ContractTransaction> {
  // Get provider and signer
  const provider = getProvider(networks.sepolia.rpcUrl);
  const signer = getSigner(provider);
  
  // Get escrow contract
  const escrow = new ethers.Contract(escrowAddress, escrowABI, signer);
  
  // Call cancel function
  const tx = await escrow.cancel();
  
  return tx;
} 