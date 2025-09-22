const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create directories if they don't exist
const dirs = [
  'orders',
  'dist',
  'dist/starknet',
  'dist/evm',
  'dist/orders',
  'dist/reverse'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# EVM Configuration
PRIVATE_KEY=your_ethereum_private_key
SEPOLIA_RPC_URL=https://sepolia.drpc.org
ETHERSCAN_API_KEY=your_etherscan_key

# StarkNet Configuration
STARKNET_PRIVATE_KEY=your_starknet_private_key
STARKNET_ADDRESS=your_starknet_address
STARKNET_NETWORK=goerli-alpha`;

  fs.writeFileSync(envPath, envContent);
  console.log('Created .env file');
}

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
}

// Build the project
console.log('Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Project built successfully');
} catch (error) {
  console.error('Error building the project:', error.message);
}

console.log('\n🎉 Backend initialization complete!');
console.log('\n📋 Next steps:');
console.log('1. Edit the .env file with your private keys and API keys');
console.log('2. Run npm run maker:create to create your first atomic swap order');
console.log('3. Follow the instructions in the README.md file for the complete flow'); 