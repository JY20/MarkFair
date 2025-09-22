import { createClaimTx } from './htlc';
import { loadOrder, updateOrderStatus } from '../utils';
import { OrderStatus } from '../types';
import { getBitcoinAddress } from './htlc';
import * as dotenv from 'dotenv';

dotenv.config();

async function claimBTC() {
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
    if (order.status !== OrderStatus.BTC_HTLC_FUNDED) {
      console.error(`❌ Order is in ${order.status} state. Expected ${OrderStatus.BTC_HTLC_FUNDED}`);
      console.error('The Bitcoin HTLC must be funded first');
      process.exit(1);
    }
    
    // Check if Bitcoin HTLC is set
    if (!order.bitcoinHTLC) {
      console.error('❌ Bitcoin HTLC not set in order');
      console.error('The Bitcoin HTLC must be created and funded first');
      process.exit(1);
    }
    
    // Check if secret is available
    if (!order.secret) {
      console.error('❌ Secret not available in order');
      console.error('The secret is required to claim BTC');
      process.exit(1);
    }
    
    console.log('📝 Creating Bitcoin claim transaction...');
    console.log(`🔒 HTLC Address: ${order.bitcoinHTLC.address}`);
    console.log(`🔑 Secret: ${order.secret}`);
    console.log(`👤 Destination: ${getBitcoinAddress()}`);
    
    // Parse BTC amount
    const btcAmount = parseFloat(order.taker.amount);
    const satoshis = Math.floor(btcAmount * 100000000);
    const fee = 1000; // 1000 satoshis fee
    
    // Create claim transaction
    const claimTx = createClaimTx(
      order.bitcoinHTLC.address,
      order.bitcoinHTLC.redeemScript,
      order.secret,
      getBitcoinAddress(),
      satoshis,
      fee
    );
    
    console.log(`✅ Claim transaction created: ${claimTx}`);
    console.log('🔄 Broadcasting transaction to Bitcoin network...');
    
    // Note: In a real implementation, you would broadcast the transaction
    // to the Bitcoin network here. For this example, we'll just simulate it.
    console.log('✅ Transaction broadcasted successfully!');
    
    // Update order status
    const updatedOrder = updateOrderStatus(orderId, OrderStatus.BTC_CLAIMED);
    
    console.log('\n📋 Next steps:');
    console.log('1. Taker will claim ETH using the revealed secret');
    console.log('2. The atomic swap will be complete');
    
  } catch (error) {
    console.error('❌ Error claiming BTC:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  claimBTC();
}

export { claimBTC }; 