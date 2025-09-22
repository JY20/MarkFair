import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting AtomicSwap Integration deployment to Sepolia...");

  try {
    const hre: HardhatRuntimeEnvironment = require("hardhat");
    
    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    // Contract addresses (from previous deployments)
    const HTLC_FACTORY_ADDRESS = "0x53195abE02b3fc143D325c29F6EA2c963C8e9fc6";
    const ONEINCH_WRAPPER_ADDRESS = "0x5633F8a3FeFF2E8F615CbB17CC29946a51BaEEf9";

    console.log("🏭 Deploying AtomicSwapIntegration...");
    console.log("HTLC Factory:", HTLC_FACTORY_ADDRESS);
    console.log("1inch Wrapper:", ONEINCH_WRAPPER_ADDRESS);

    // Deploy AtomicSwapIntegration
    const AtomicSwapIntegration = await hre.ethers.getContractFactory("AtomicSwapIntegration");
    const atomicSwapIntegration = await AtomicSwapIntegration.deploy(
      HTLC_FACTORY_ADDRESS,
      ONEINCH_WRAPPER_ADDRESS
    );
    await atomicSwapIntegration.deployed();
    console.log("✅ AtomicSwapIntegration deployed to:", atomicSwapIntegration.address);

    // Save deployment info
    const deploymentInfo = {
      atomicSwapIntegration: atomicSwapIntegration.address,
      htlcFactory: HTLC_FACTORY_ADDRESS,
      oneInchWrapper: ONEINCH_WRAPPER_ADDRESS,
      network: "sepolia",
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      blockNumber: await hre.ethers.provider.getBlockNumber()
    };

    const addressesPath = path.join(__dirname, '../../deployed-integration-addresses.json');
    fs.writeFileSync(
      addressesPath, 
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n🎉 AtomicSwap Integration deployed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("AtomicSwapIntegration:", atomicSwapIntegration.address);
    console.log("HTLC Factory:", HTLC_FACTORY_ADDRESS);
    console.log("1inch Wrapper:", ONEINCH_WRAPPER_ADDRESS);
    console.log("\n💾 Addresses saved to deployed-integration-addresses.json");

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
    
    // Add integration contract addresses to config
    const newConfig = configContent.replace(
      /export const oneInchContracts = {/,
      `export const integrationContracts = {
  atomicSwapIntegration: "${deploymentInfo.atomicSwapIntegration}",
  htlcFactory: "${deploymentInfo.htlcFactory}",
  oneInchWrapper: "${deploymentInfo.oneInchWrapper}",
  network: "${deploymentInfo.network}"
};

export const oneInchContracts = {`
    );
    
    fs.writeFileSync(configPath, newConfig);
    console.log("✅ Config file updated with integration contract addresses");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 