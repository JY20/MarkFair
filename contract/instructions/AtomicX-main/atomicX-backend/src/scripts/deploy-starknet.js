const { Account, Provider } = require("starknet");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log("🚀 Starting StarkNet contract deployment to Sepolia...");

  const privateKey = process.env.STARKNET_PRIVATE_KEY;
  const address = process.env.STARKNET_ADDRESS;
  
  if (!privateKey || !address) {
    throw new Error("Missing STARKNET_PRIVATE_KEY or STARKNET_ADDRESS");
  }

  // Use StarkNet Sepolia
  const provider = new Provider({
    sequencer: {
      baseUrl: 'https://starknet-testnet.drpc.org'
    }
  });

  const account = new Account(provider, address, privateKey);
  console.log("📝 Using account:", account.address);

  // Simple test contract for deployment
  const testContract = `
%lang starknet
%builtins pedersen range_check

@storage_var
func balance() -> (res: felt) {
}

@external
func increase_balance(amount: felt) {
    let (res) = balance.read();
    balance.write(res + amount);
    return ();
}

@view
func get_balance() -> (res: felt) {
    let (res) = balance.read();
    return (res);
}
  `;

  try {
    console.log("�� Declaring contract...");
    const declareResponse = await account.declare({
      contract: testContract
    });
    
    console.log("✅ Contract declared. Class hash:", declareResponse.class_hash);
    
    console.log("�� Deploying contract...");
    const deployResponse = await account.deployContract({
      classHash: declareResponse.class_hash,
      constructorCalldata: []
    });

    console.log("✅ Contract deployed successfully!");
    console.log("📋 Address:", deployResponse.contract_address);
    console.log("📋 Transaction:", deployResponse.transaction_hash);

    // Save deployment info
    const deploymentInfo = {
      contractAddress: deployResponse.contract_address,
      classHash: declareResponse.class_hash,
      transactionHash: deployResponse.transaction_hash,
      network: "sepolia",
      deployedAt: new Date().toISOString(),
      deployer: account.address
    };

    fs.writeFileSync(
      'deployed-starknet-sepolia.json', 
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("💾 Deployment info saved to deployed-starknet-sepolia.json");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch(console.error);