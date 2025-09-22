import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting StarkNet HTLC contract deployment...");

  try {
    // Get the hardhat runtime environment
    const hre: HardhatRuntimeEnvironment = require("hardhat");
    
    // First, compile the Cairo contracts
    console.log("📦 Compiling Cairo contracts...");
    await hre.run("starknet-compile");
    console.log("✅ Cairo contracts compiled successfully!");
    
    // Deploy the contract using the compiled artifacts
    console.log("🚀 Deploying HTLC contract to StarkNet Sepolia...");
    
    const contractFactory = await hre.starknet.getContractFactory("StarknetHTLC");
    const contract = await contractFactory.deploy();
    
    console.log("✅ Contract deployed successfully!");
    console.log("📋 Contract Address:", contract.address);
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress: contract.address,
      network: "sepolia",
      deployedAt: new Date().toISOString(),
      deployer: contract.deployer,
      transactionHash: contract.deployTransactionHash
    };

    const addressesPath = path.join(__dirname, '../../deployed-starknet-addresses.json');
    fs.writeFileSync(
      addressesPath, 
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n🎉 StarkNet HTLC contract deployed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("HTLC Contract:", contract.address);
    console.log("\n💾 Addresses saved to deployed-starknet-addresses.json");

    // Update config file
    updateConfigFile(contract.address);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

function updateConfigFile(htlcAddress: string) {
  const configPath = path.join(__dirname, '../config.ts');
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update HTLC address
    configContent = configContent.replace(
      /starknetHtlcAddress\s*=\s*process\.env\.STARKNET_HTLC_ADDRESS\s*\|\|\s*['"][^'"]*['"]/g,
      `starknetHtlcAddress = '${htlcAddress}'`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log("✅ Updated config.ts with new HTLC address");
  }
}

main()
  .then(() => {
    console.log("\n🎯 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ StarkNet deployment failed:", error);
    process.exit(1);
  }); 