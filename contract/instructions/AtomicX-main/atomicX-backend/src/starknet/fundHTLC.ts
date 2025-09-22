import { loadOrder, updateOrderStatus } from '../utils';
import { OrderStatus } from '../types';
import { getStarknetAccount } from './htlc';
import * as starknet from 'starknet';
import * as dotenv from 'dotenv';

dotenv.config();

async function fundHTLC() {
  try {
    // Get order ID from environment variable
    const orderId = process.env.ORDER_ID;
    
    if (!orderId) {
      console.error('❌ ORDER_ID environment variable not set');
      console.error('Usage: ORDER_ID=order_123 npm run taker:fund');
      process.exit(1);
    }
    
    console.log(`🔍 Loading order ${orderId}...`);
    const order = loadOrder(orderId);
    
    // Check if order is in the correct state
    if (order.status !== OrderStatus.EVM_ESCROW_CREATED) {
      console.error(`❌ Order is in ${order.status} state. Expected ${OrderStatus.EVM_ESCROW_CREATED}`);
      console.error('The maker must create the EVM escrow first');
      process.exit(1);
    }
    
    // Check if Starknet HTLC is set
    if (!order.starknetHTLC) {
      console.error('❌ Starknet HTLC not set in order');
      console.error('The Starknet HTLC must be created first');
      process.exit(1);
    }
    
    console.log('\n📝 Funding Starknet HTLC...');
    console.log(`🔒 HTLC ID: ${order.starknetHTLC.htlcId}`);
    console.log(`💰 Amount: ${order.taker.amount} tokens`);
    
    // Get StarkNet account
    const account = await getStarknetAccount();
    
    // Note: In a real implementation, we would transfer tokens to the HTLC contract
    // For this example, we'll simulate the funding by waiting for user confirmation
    
    console.log('\n⚠️ Please ensure you have approved the token transfer to the HTLC contract.');
    console.log(`Token contract: ${order.taker.asset}`);
    console.log(`HTLC contract: ${order.starknetHTLC.contractAddress}`);
    console.log(`Amount: ${order.taker.amount}`);
    
    // Wait for user confirmation
    console.log('\nPress Enter after you have funded the HTLC...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    
    // Update order status
    const updatedOrder = updateOrderStatus(orderId, OrderStatus.STARKNET_HTLC_FUNDED);
    
    console.log('\n✅ Starknet HTLC funding confirmed!');
    
    console.log('\n📋 Next steps:');
    console.log('1. Maker will claim Starknet assets using their secret');
    console.log('2. You will claim ETH/tokens using the revealed secret');
    
  } catch (error) {
    console.error('❌ Error funding HTLC:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  fundHTLC();
}

export { fundHTLC }; 