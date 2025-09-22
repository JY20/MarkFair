import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting 1inch Limit Order Protocol deployment to Sepolia...");

  try {
    const hre: HardhatRuntimeEnvironment = require("hardhat");
    
    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    // For now, we'll use the official 1inch contract addresses
    // These are the mainnet addresses, but for testnet we need to deploy our own
    console.log("🏭 Using 1inch Limit Order Protocol contracts...");
    
    // Since we can't deploy the official 1inch contracts directly,
    // we'll create a simple wrapper that integrates with the 1inch protocol
    const OneInchWrapper = await hre.ethers.getContractFactory("OneInchWrapper");
    const oneInchWrapper = await OneInchWrapper.deploy();
    await oneInchWrapper.deployed();
    console.log("✅ OneInchWrapper deployed to:", oneInchWrapper.address);

    // Save deployment info
    const deploymentInfo = {
      oneInchWrapper: oneInchWrapper.address,
      network: "sepolia",
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      blockNumber: await hre.ethers.provider.getBlockNumber(),
      note: "This wrapper integrates with 1inch Limit Order Protocol for atomic swaps"
    };

    const addressesPath = path.join(__dirname, '../../deployed-1inch-addresses.json');
    fs.writeFileSync(
      addressesPath, 
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n🎉 1inch integration contracts deployed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("OneInchWrapper:", oneInchWrapper.address);
    console.log("\n💾 Addresses saved to deployed-1inch-addresses.json");

    // Update config file
    updateConfigFile(deploymentInfo);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

function updateConfigFile(deploymentInfo: any) {
  const configPath = path.join(__dirname, '../config.ts');
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Add 1inch contract addresses to config
    const newConfig = configContent.replace(
      /export const starknetNetworks = {/,
      `export const oneInchContracts = {
  oneInchWrapper: "${deploymentInfo.oneInchWrapper}",
  network: "${deploymentInfo.network}"
};

export const starknetNetworks = {`
    );
    
    fs.writeFileSync(configPath, newConfig);
    console.log("✅ Config file updated with 1inch contract addresses");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 