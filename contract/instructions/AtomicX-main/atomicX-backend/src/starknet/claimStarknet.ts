import { withdrawFromHTLC } from './htlc';
import { loadOrder, updateOrderStatus } from '../utils';
import { OrderStatus } from '../types';
import * as dotenv from 'dotenv';

dotenv.config();

async function claimStarknet() {
  try {
    // Get order ID from environment variable
    const orderId = process.env.ORDER_ID;
    
    if (!orderId) {
      console.error('❌ ORDER_ID environment variable not set');
      console.error('Usage: ORDER_ID=order_123 npm run maker:claim');
      process.exit(1);
    }
    
    console.log(`🔍 Loading order ${orderId}...`);
    const order = loadOrder(orderId);
    
    // Check if order is in the correct state
    if (order.status !== OrderStatus.STARKNET_HTLC_FUNDED) {
      console.error(`❌ Order is in ${order.status} state. Expected ${OrderStatus.STARKNET_HTLC_FUNDED}`);
      console.error('The Starknet HTLC must be funded first');
      process.exit(1);
    }
    
    // Check if Starknet HTLC is set
    if (!order.starknetHTLC) {
      console.error('❌ Starknet HTLC not set in order');
      console.error('The Starknet HTLC must be created and funded first');
      process.exit(1);
    }
    
    // Check if secret is available
    if (!order.secret) {
      console.error('❌ Secret not available in order');
      console.error('The secret is required to claim Starknet assets');
      process.exit(1);
    }
    
    console.log('📝 Creating Starknet claim transaction...');
    console.log(`🔒 HTLC ID: ${order.starknetHTLC.htlcId}`);
    console.log(`🔑 Secret: ${order.secret}`);
    
    // Withdraw from HTLC using secret
    const txHash = await withdrawFromHTLC(
      order.starknetHTLC.htlcId,
      order.secret
    );
    
    console.log(`✅ Claim transaction submitted: ${txHash}`);
    
    // Update order status
    const updatedOrder = updateOrderStatus(orderId, OrderStatus.STARKNET_CLAIMED);
    
    console.log('\n📋 Next steps:');
    console.log('1. Taker will claim ETH using the revealed secret');
    console.log('2. The atomic swap will be complete');
    
  } catch (error) {
    console.error('❌ Error claiming Starknet assets:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  claimStarknet();
}

export { claimStarknet }; 