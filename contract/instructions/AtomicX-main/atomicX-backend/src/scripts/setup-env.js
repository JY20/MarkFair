const fs = require('fs');
const path = require('path');

console.log("🔧 Setting up environment variables for AtomicX deployment...\n");

// Check if .env file exists
const envPath = path.join(__dirname, '../../.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log("✅ .env file already exists");
} else {
  console.log("📝 Creating .env file...");
  
  const envContent = `# EVM Configuration
PRIVATE_KEY=your_ethereum_private_key_here
SEPOLIA_RPC_URL=https://sepolia.drpc.org
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# StarkNet Configuration
STARKNET_PRIVATE_KEY=your_starknet_private_key_here
STARKNET_ADDRESS=your_starknet_address_here
STARKNET_NETWORK=goerli-alpha
STARKNET_RPC_URL=https://alpha4.starknet.io

# Contract Addresses (will be filled after deployment)
STARKNET_HTLC_ADDRESS=0x0
`;

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file created successfully");
}

console.log("\n📋 Required Environment Variables:");
console.log("==================================");
console.log("🔵 EVM (Ethereum Sepolia):");
console.log("   - PRIVATE_KEY: Your Ethereum private key (without 0x prefix)");
console.log("   - SEPOLIA_RPC_URL: Sepolia RPC endpoint (default: https://sepolia.drpc.org)");
console.log("   - ETHERSCAN_API_KEY: Etherscan API key for contract verification");
console.log("");
console.log("🟣 StarkNet (Goerli):");
console.log("   - STARKNET_PRIVATE_KEY: Your StarkNet private key");
console.log("   - STARKNET_ADDRESS: Your StarkNet account address");
console.log("   - STARKNET_NETWORK: Network name (default: goerli-alpha)");
console.log("   - STARKNET_RPC_URL: StarkNet RPC endpoint");
console.log("");

console.log("💰 Getting Testnet Funds:");
console.log("=========================");
console.log("🔵 Sepolia ETH: https://sepoliafaucet.com/");
console.log("🟣 StarkNet Goerli: https://faucet.goerli.starknet.io/");
console.log("");

console.log("🚀 Deployment Commands:");
console.log("=======================");
console.log("npm run deploy:ethereum  # Deploy Ethereum contracts to Sepolia");
console.log("npm run deploy:starknet  # Deploy StarkNet contracts to Goerli");
console.log("npm run deploy:all       # Deploy both Ethereum and StarkNet contracts");
console.log("");

if (!envExists) {
  console.log("⚠️  IMPORTANT: Please edit the .env file with your actual values before deploying!");
} else {
  console.log("✅ Environment setup complete. You can now run deployment commands.");
} 