import { createSourceEscrow } from './escrow';
import { loadOrder, updateOrderStatus } from '../utils';
import { OrderStatus } from '../types';
import { networks } from '../config';
import * as dotenv from 'dotenv';

dotenv.config();

async function createEscrow() {
  try {
    // Get order ID from environment variable
    const orderId = process.env.ORDER_ID;
    
    if (!orderId) {
      console.error('❌ ORDER_ID environment variable not set');
      console.error('Usage: ORDER_ID=order_123 npm run maker:escrow');
      process.exit(1);
    }
    
    console.log(`🔍 Loading order ${orderId}...`);
    const order = loadOrder(orderId);
    
    // Check if order is in the correct state
    if (order.status !== OrderStatus.FILLED) {
      console.error(`❌ Order is in ${order.status} state. Expected ${OrderStatus.FILLED}`);
      console.error('The taker must fill the order first');
      process.exit(1);
    }
    
    // Check if taker address is set
    if (!order.taker.address) {
      console.error('❌ Taker address not set in order');
      console.error('The taker must fill the order first');
      process.exit(1);
    }
    
    console.log('📝 Creating EVM escrow contract...');
    console.log(`👤 Maker: ${order.maker.address}`);
    console.log(`👤 Taker: ${order.taker.address}`);
    console.log(`💰 Amount: ${order.maker.amount} wei`);
    console.log(`🔒 Hashlock: ${order.hashlock}`);
    
    // Create escrow contract
    const escrowAddress = await createSourceEscrow(order);
    
    console.log(`✅ Escrow contract created at ${escrowAddress}`);
    console.log(`🔗 View on Etherscan: ${networks.sepolia.explorerUrl}/address/${escrowAddress}`);
    
    // Update order status
    const updatedOrder = updateOrderStatus(orderId, OrderStatus.EVM_ESCROW_CREATED, {
      evmEscrow: {
        address: escrowAddress,
        timelocks: {
          withdrawalPeriod: 0,
          cancellationPeriod: 3600
        }
      }
    });
    
    console.log('\n📋 Next steps:');
    console.log('1. Taker will fund the Bitcoin HTLC');
    console.log(`2. You will claim BTC using your secret: ${order.secret}`);
    
  } catch (error) {
    console.error('❌ Error creating escrow:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  createEscrow();
}

export { createEscrow }; 