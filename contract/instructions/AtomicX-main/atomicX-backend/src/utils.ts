import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ethers } from 'ethers';
import { Order } from './types';

// Generate a random secret for atomic swaps
export function generateSecret(): { secret: string, hashlock: string } {
  const secret = crypto.randomBytes(32);
  const secretHex = "0x" + secret.toString('hex');
  const hashlock = ethers.utils.sha256(secretHex);
  
  return { secret: secretHex, hashlock };
}

// Generate a unique order ID
export function generateOrderId(prefix: string = 'order'): string {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}`;
}

// Save order to JSON file
export function saveOrder(order: Order): void {
  const ordersDir = path.join(__dirname, '..', 'orders');
  
  // Create orders directory if it doesn't exist
  if (!fs.existsSync(ordersDir)) {
    fs.mkdirSync(ordersDir, { recursive: true });
  }
  
  const filePath = path.join(ordersDir, `${order.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(order, null, 2));
  
  console.log(`Order saved to ${filePath}`);
}

// Load order from JSON file
export function loadOrder(orderId: string): Order {
  const filePath = path.join(__dirname, '..', 'orders', `${orderId}.json`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Order file not found: ${filePath}`);
  }
  
  const orderData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(orderData) as Order;
}

// Update order status and save
export function updateOrderStatus(orderId: string, status: string, additionalData: any = {}): Order {
  const order = loadOrder(orderId);
  order.status = status as any;
  
  // Merge additional data with order
  Object.assign(order, additionalData);
  
  saveOrder(order);
  return order;
}

// Format amount with proper decimals
export function formatAmount(amount: string, decimals: number = 18): string {
  return ethers.utils.formatUnits(amount, decimals);
}

// Parse amount to wei
export function parseAmount(amount: string, decimals: number = 18): string {
  return ethers.utils.parseUnits(amount, decimals).toString();
}

// Get EVM provider based on network
export function getProvider(rpcUrl: string): ethers.providers.JsonRpcProvider {
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

// Get EVM signer
export function getSigner(provider: ethers.providers.Provider): ethers.Wallet {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not found in environment variables');
  }
  
  return new ethers.Wallet(privateKey, provider);
}

// Convert timelock values to packed uint256
export function packTimelocks(withdrawalPeriod: number, cancellationPeriod: number): string {
  const withdrawalBN = ethers.BigNumber.from(withdrawalPeriod);
  const cancellationBN = ethers.BigNumber.from(cancellationPeriod);
  const packedBN = withdrawalBN.add(cancellationBN.shl(128));
  return packedBN.toString();
}

// Unpack timelock values from uint256
export function unpackTimelocks(packedTimelocks: string): { withdrawalPeriod: number, cancellationPeriod: number } {
  const packedBN = ethers.BigNumber.from(packedTimelocks);
  const mask = ethers.BigNumber.from(2).pow(128).sub(1);
  
  const withdrawalPeriod = packedBN.and(mask).toNumber();
  const cancellationPeriod = packedBN.shr(128).and(mask).toNumber();
  
  return { withdrawalPeriod, cancellationPeriod };
} 