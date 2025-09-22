import { createOrder } from './orders/createOrder';
import { fillOrder } from './orders/fillOrder';
import { createEscrow } from './evm/createEscrow';
import { fundHTLC } from './starknet/fundHTLC';
import { claimStarknet } from './starknet/claimStarknet';
import { claimEVM } from './evm/claimEVM';
import * as dotenv from 'dotenv';

dotenv.config();

// Display help message
function showHelp() {
  console.log('🌉 AtomicX Backend - EVM ↔ StarkNet Atomic Swap System');
  console.log('\nUsage:');
  console.log('  npm run maker:create               Create a new atomic swap order (EVM → StarkNet)');
  console.log('  ORDER_ID=<id> npm run taker:fill   Fill an existing order as taker');
  console.log('  ORDER_ID=<id> npm run maker:escrow Create EVM escrow for an order');
  console.log('  ORDER_ID=<id> npm run taker:fund   Fund StarkNet HTLC for an order');
  console.log('  ORDER_ID=<id> npm run maker:claim  Claim StarkNet assets from HTLC using secret');
  console.log('  ORDER_ID=<id> npm run taker:claim  Claim ETH/tokens from escrow using revealed secret');
  console.log('\nReverse Flow (StarkNet → EVM):');
  console.log('  npm run reverse:create                       Create a reverse atomic swap order (StarkNet → EVM)');
  console.log('  ORDER_ID=<id> npm run reverse:maker:htlc     Create StarkNet HTLC for reverse order');
  console.log('  ORDER_ID=<id> npm run reverse:maker:fund     Fund StarkNet HTLC for reverse order');
  console.log('  ORDER_ID=<id> npm run reverse:taker:escrow   Create EVM escrow for reverse order');
  console.log('  ORDER_ID=<id> npm run reverse:maker:claim    Claim ETH/tokens from escrow using secret');
  console.log('  ORDER_ID=<id> npm run reverse:taker:claim    Claim StarkNet assets from HTLC using revealed secret');
}

// Main function
async function main() {
  // Get command from arguments
  const command = process.argv[2];
  
  if (!command) {
    showHelp();
    return;
  }
  
  // Execute command
  switch (command) {
    case 'create':
      await createOrder();
      break;
    case 'fill':
      await fillOrder();
      break;
    case 'escrow':
      await createEscrow();
      break;
    case 'fund':
      await fundHTLC();
      break;
    case 'claim-starknet':
      await claimStarknet();
      break;
    case 'claim-evm':
      await claimEVM();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export {
  createOrder,
  fillOrder,
  createEscrow,
  fundHTLC,
  claimStarknet,
  claimEVM
}; 