import { withdrawFromEscrow } from './escrow';
import { loadOrder, updateOrderStatus } from '../utils';
import { OrderStatus } from '../types';
import { networks } from '../config';
import * as dotenv from 'dotenv';

dotenv.config();

async function claimEVM() {
  try {
    // Get order ID from environment variable
    const orderId = process.env.ORDER_ID;
    
    if (!orderId) {
      console.error('❌ ORDER_ID environment variable not set');
      console.error('Usage: ORDER_ID=order_123 npm run taker:claim');
      process.exit(1);
    }
    
    console.log(`🔍 Loading order ${orderId}...`);
    const order = loadOrder(orderId);
    
    // Check if order is in the correct state
    if (order.status !== OrderStatus.BTC_CLAIMED) {
      console.error(`❌ Order is in ${order.status} state. Expected ${OrderStatus.BTC_CLAIMED}`);
      console.error('The maker must claim BTC first to reveal the secret');
      process.exit(1);
    }
    
    // Check if EVM escrow is set
    if (!order.evmEscrow) {
      console.error('❌ EVM escrow not set in order');
      console.error('The EVM escrow must be created first');
      process.exit(1);
    }
    
    // Check if secret is available
    if (!order.secret) {
      console.error('❌ Secret not available in order');
      console.error('The secret is required to claim ETH/tokens');
      process.exit(1);
    }
    
    console.log('📝 Claiming from EVM escrow contract...');
    console.log(`🔒 Escrow Address: ${order.evmEscrow.address}`);
    console.log(`🔑 Secret: ${order.secret}`);
    
    // Withdraw from escrow using secret
    const tx = await withdrawFromEscrow(order.evmEscrow.address, order.secret);
    
    console.log(`✅ Withdrawal transaction submitted: ${tx.hash}`);
    console.log(`🔗 View on Etherscan: ${networks.sepolia.explorerUrl}/tx/${tx.hash}`);
    
    // Wait for transaction to be mined
    console.log('⏳ Waiting for transaction to be mined...');
    const receipt = await tx.wait();
    
    console.log(`✅ Transaction mined in block ${receipt.blockNumber}`);
    
    // Update order status
    const updatedOrder = updateOrderStatus(orderId, OrderStatus.COMPLETED);
    
    console.log('\n🎉 Atomic swap completed successfully!');
    console.log('✅ Maker received BTC');
    console.log('✅ Taker received ETH/tokens');
    
  } catch (error) {
    console.error('❌ Error claiming from escrow:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  claimEVM();
}

export { claimEVM }; 