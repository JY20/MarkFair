import * as starknet from 'starknet';
import { StarknetHTLC } from '../types';
import { starknetNetworks, starknetTimelock, starknetHtlcAddress, starknetHtlcABI } from '../config';
import * as dotenv from 'dotenv';

dotenv.config();

// Get StarkNet network
export function getStarknetNetwork() {
  const networkName = process.env.STARKNET_NETWORK || 'sepolia';
  const network = networkName === 'sepolia' ? starknetNetworks.sepolia : starknetNetworks.goerliAlpha;
  return network;
}

// Get StarkNet provider
export function getStarknetProvider() {
  const network = getStarknetNetwork();
  return new starknet.Provider({ sequencer: { network: network.name as starknet.constants.NetworkName } });
}

// Get StarkNet account
export async function getStarknetAccount() {
  const privateKey = process.env.STARKNET_PRIVATE_KEY;
  const address = process.env.STARKNET_ADDRESS;
  
  if (!privateKey || !address) {
    throw new Error('STARKNET_PRIVATE_KEY or STARKNET_ADDRESS not found in environment variables');
  }
  
  const provider = getStarknetProvider();
  
  return new starknet.Account(
    provider,
    address,
    privateKey
  );
}

// Create HTLC on StarkNet
export async function createHTLC(
  hashlock: string,
  recipientAddress: string,
  tokenAddress: string,
  amount: string,
  timelock: number = starknetTimelock
): Promise<StarknetHTLC> {
  // Get StarkNet account
  const account = await getStarknetAccount();
  
  // Remove 0x prefix if present
  const hashlockHex = hashlock.startsWith('0x') ? hashlock.slice(2) : hashlock;
  
  // Convert to StarkNet felt
  const hashlockFelt = starknet.num.toHex(hashlockHex);
  
  // Prepare contract call
  const contract = new starknet.Contract(
    starknetHtlcABI,
    starknetHtlcAddress,
    account
  );
  
  // Convert amount to Uint256
  const amountUint256 = {
    low: starknet.num.toHex(amount),
    high: '0x0'
  };
  
  // Create HTLC on StarkNet
  const { transaction_hash } = await account.execute({
    contractAddress: starknetHtlcAddress,
    entrypoint: 'create_htlc',
    calldata: [
      hashlockFelt,
      recipientAddress,
      tokenAddress,
      amountUint256.low,
      amountUint256.high,
      starknet.num.toHex(timelock)
    ]
  });
  
  // Wait for transaction to be accepted
  await account.waitForTransaction(transaction_hash);
  
  // Get transaction receipt
  const receipt = await account.provider.getTransactionReceipt(transaction_hash);
  
  // Extract HTLC ID from events
  const htlcId = receipt.events?.[0].data[0];
  
  if (!htlcId) {
    throw new Error('Failed to get HTLC ID from transaction receipt');
  }
  
  // Get HTLC details
  const htlcDetails = await contract.call('get_htlc', [htlcId]);
  
  return {
    contractAddress: starknetHtlcAddress,
    htlcId,
    sender: htlcDetails.sender,
    recipient: htlcDetails.recipient,
    token: htlcDetails.token,
    amount: htlcDetails.amount.low,
    hashlock: htlcDetails.hashlock,
    timelock: Number(htlcDetails.timelock),
    withdrawn: Boolean(Number(htlcDetails.withdrawn)),
    refunded: Boolean(Number(htlcDetails.refunded)),
    createdAt: Number(htlcDetails.created_at)
  };
}

// Withdraw from HTLC using secret
export async function withdrawFromHTLC(
  htlcId: string,
  secret: string
): Promise<string> {
  // Get StarkNet account
  const account = await getStarknetAccount();
  
  // Remove 0x prefix if present
  const secretHex = secret.startsWith('0x') ? secret.slice(2) : secret;
  
  // Convert to StarkNet felt
  const secretFelt = starknet.num.toHex(secretHex);
  
  // Withdraw from HTLC
  const { transaction_hash } = await account.execute({
    contractAddress: starknetHtlcAddress,
    entrypoint: 'withdraw',
    calldata: [htlcId, secretFelt]
  });
  
  // Wait for transaction to be accepted
  await account.waitForTransaction(transaction_hash);
  
  return transaction_hash;
}

// Refund HTLC after timelock
export async function refundHTLC(htlcId: string): Promise<string> {
  // Get StarkNet account
  const account = await getStarknetAccount();
  
  // Refund HTLC
  const { transaction_hash } = await account.execute({
    contractAddress: starknetHtlcAddress,
    entrypoint: 'refund',
    calldata: [htlcId]
  });
  
  // Wait for transaction to be accepted
  await account.waitForTransaction(transaction_hash);
  
  return transaction_hash;
}

// Get HTLC details
export async function getHTLC(htlcId: string): Promise<StarknetHTLC> {
  // Get StarkNet provider
  const provider = getStarknetProvider();
  
  // Create contract instance
  const contract = new starknet.Contract(
    starknetHtlcABI,
    starknetHtlcAddress,
    provider
  );
  
  // Get HTLC details
  const htlcDetails = await contract.call('get_htlc', [htlcId]);
  
  return {
    contractAddress: starknetHtlcAddress,
    htlcId,
    sender: htlcDetails.sender,
    recipient: htlcDetails.recipient,
    token: htlcDetails.token,
    amount: htlcDetails.amount.low,
    hashlock: htlcDetails.hashlock,
    timelock: Number(htlcDetails.timelock),
    withdrawn: Boolean(Number(htlcDetails.withdrawn)),
    refunded: Boolean(Number(htlcDetails.refunded)),
    createdAt: Number(htlcDetails.created_at)
  };
} 