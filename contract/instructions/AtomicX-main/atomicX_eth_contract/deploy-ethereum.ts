import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting Ethereum contract deployment to Sepolia...");

  // Check environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in environment variables");
  }
  
  if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL not found in environment variables");
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.isZero()) {
    throw new Error("Deployer account has no ETH. Please fund your account on Sepolia testnet.");
  }

  // Deploy StarknetEscrowFactory
  console.log("\n🏭 Deploying StarknetEscrowFactory...");
  const StarknetEscrowFactory = await ethers.getContractFactory("StarknetEscrowFactory");
  const factory = await StarknetEscrowFactory.deploy();
  await factory.deployed();
  console.log("✅ StarknetEscrowFactory deployed to:", factory.address);

  // Save Ethereum addresses
  const ethereumAddresses = {
    starknetEscrowFactory: factory.address,
    network: "sepolia",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const addressesPath = path.join(__dirname, '../../deployed-ethereum-addresses.json');
  fs.writeFileSync(
    addressesPath, 
    JSON.stringify(ethereumAddresses, null, 2)
  );

  console.log("\n🎉 Ethereum contracts deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("StarknetEscrowFactory:", factory.address);
  console.log("\n💾 Addresses saved to deployed-ethereum-addresses.json");
  
  // Update config file
  updateConfigFile(factory.address);
}

function updateConfigFile(factoryAddress: string) {
  const configPath = path.join(__dirname, '../config.ts');
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update factory address
    configContent = configContent.replace(
      /factoryAddress:\s*['"][^'"]*['"]/g,
      `factoryAddress: '${factoryAddress}'`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log("✅ Updated config.ts with new contract address");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Ethereum deployment failed:", error);
    process.exit(1);
  }); 