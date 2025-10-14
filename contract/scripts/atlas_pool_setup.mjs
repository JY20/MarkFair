/**
 * =============================================================================
 * ATLAS Frontend Test Pool Setup Script
 * =============================================================================
 *
 * Function: Create a complete test environment for the Atlas frontend team
 * Includes: 1 funding pool + 1 claimable pool
 *
 * Pool 1: 1000 MKFR funding pool (for frontend to test funding functionality)
 * Pool 2: 10000 MKFR claimable pool (for frontend to test claiming functionality)
 * =============================================================================
 */

import { hash, ec, shortString, CallData, RpcProvider, Account } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

// ===== Configuration Information =====
const CONFIG = {
  // Network configuration
  network: "sepolia",
  rpcUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8",
  
  // Contract addresses
  kolEscrowAddress: "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a",
  mkfrTokenAddress: "0x075d470cb627938cb8f835fd01cab06b7fab0fbe4b2eeb2f6e6175edad0f98ec",
  
  // Test accounts (from deploy_testnet.md)
  accounts: {
    main: "0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930", // your main account
    atlas: "0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930", // atlas
    jimmy: "0x012B099F50C3CbCc82ccF7Ee557c9d60255c35C359eA6615435B761Ec3336EC8", // jimmy  
    leo: "0x0299970bA982112ab018832b2875fF750409d5239c1Cc056e98402d8D53Bd148"   // leo
  },
  
  // Attester keys
  attesterPK: "0x57f16e241689e66d3a7c9b35d4f09d7bb492d062a0fa2166a7a4b366b777fe1",
  attesterSK: "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f",
  
  // Pool configuration
  pools: {
    funding: {
      id: 0x2001,
      name: "Atlas_Funding_Test",
      amount: "1000000000000000000000", // 1000 MKFR
      status: "funding"
    },
    claimable: {
      id: 0x2002, 
      name: "Atlas_Claimable_Test",
      amount: "10000000000000000000000", // 10000 MKFR
      status: "claimable"
    }
  }
};

// ===== Utility Functions =====

function normalizeHex(h) {
  if (typeof h === "bigint") h = "0x" + h.toString(16);
  if (typeof h === "number") h = "0x" + h.toString(16);
  if (typeof h !== "string") h = h.toString();
  if (!h.startsWith("0x")) h = "0x" + h;
  return h;
}

function normalizeHexForLib(h) {
  const normalized = normalizeHex(h);
  return normalized.length % 2 === 0 ? normalized : "0x0" + normalized.slice(2);
}

// Merkle tree related functions
function customLeafHash(user, shares) {
  const userHex = normalizeHexForLib(user);
  const sharesHex = normalizeHexForLib(shares);
  return hash.pedersen([userHex, sharesHex]);
}

function customNodeHash(left, right) {
  const leftHex = normalizeHexForLib(left);
  const rightHex = normalizeHexForLib(right);
  return hash.pedersen([leftHex, rightHex]);
}

function buildMerkleTree(userData) {
  const leaves = userData.map(({ user, shares }) => customLeafHash(user, shares));
  return new SimpleMerkleTree(leaves, customNodeHash);
}

function computeDomainHash(poolId, epoch) {
  const poolIdHex = normalizeHexForLib(poolId);
  const epochHex = normalizeHexForLib(epoch);
  return hash.pedersen([poolIdHex, epochHex]);
}

function signFinalize(poolId, epoch, merkleRoot, privateKey) {
  const domainHash = computeDomainHash(poolId, epoch);
  const messageHash = hash.pedersen([domainHash, normalizeHexForLib(merkleRoot)]);
  const keyPair = ec.starkCurve.getStarkKey(privateKey);
  const signature = ec.starkCurve.sign(messageHash, privateKey);
  return [signature.r.toString(), signature.s.toString()];
}

// ===== Main Functions =====

async function setupClaimablePool() {
  console.log("\n🎯 Setting up claimable pool (Pool 0x2002)...");
  
  // 4-person test data - total 10000 MKFR
  const userData = [
    { user: CONFIG.accounts.main, shares: "2500000000000000000000" },  // 2500 MKFR (25%)
    { user: CONFIG.accounts.atlas, shares: "2500000000000000000000" }, // 2500 MKFR (25%) 
    { user: CONFIG.accounts.jimmy, shares: "2500000000000000000000" }, // 2500 MKFR (25%)
    { user: CONFIG.accounts.leo, shares: "2500000000000000000000" }    // 2500 MKFR (25%)
  ];
  
  console.log("📊 User allocation:");
  userData.forEach(({user, shares}, i) => {
    const name = Object.keys(CONFIG.accounts)[i];
    const amount = (BigInt(shares) / BigInt("1000000000000000000")).toString();
    console.log(`  ${name}: ${amount} MKFR (${user})`);
  });
  
  // Generate Merkle tree
  const merkleTree = buildMerkleTree(userData);
  const merkleRoot = merkleTree.root;
  
  console.log(`🌳 Merkle Root: ${merkleRoot}`);
  
  // Generate signature
  const poolId = CONFIG.pools.claimable.id;
  const epoch = 1;
  const [r, s] = signFinalize(poolId, epoch, merkleRoot, CONFIG.attesterSK);
  
  console.log(`✍️  Signature: r=${r}, s=${s}`);
  
  // Generate proof for each user
  console.log("\n🔐 User Proof data:");
  const proofs = {};
  userData.forEach(({user, shares}, index) => {
    const leaf = customLeafHash(user, shares);
    const proof = merkleTree.getProof(leaf);
    const name = Object.keys(CONFIG.accounts)[index];
    
    proofs[name] = {
      user,
      shares,
      proof: proof.map(p => normalizeHex(p))
    };
    
    console.log(`  ${name}:`);
    console.log(`    Address: ${user}`);
    console.log(`    Shares: ${shares} (${(BigInt(shares) / BigInt("1000000000000000000")).toString()} MKFR)`);
    console.log(`    Proof: [${proof.map(p => `"${normalizeHex(p)}"`).join(", ")}]`);
  });
  
  return {
    poolId,
    epoch,
    merkleRoot,
    signature: { r, s },
    userData,
    proofs
  };
}

// ===== Output Test Information =====

async function generateTestInfo() {
  console.log("🏊‍♂️ Atlas Frontend Test Pool Configuration");
  console.log("=" .repeat(50));
  
  // Pool 1 information
  console.log("\n✅ Pool 1: Funding Test Pool");
  console.log(`Pool ID: 0x${CONFIG.pools.funding.id.toString(16)}`);
  console.log(`Name: ${CONFIG.pools.funding.name}`);
  console.log(`Token: MKFR (${CONFIG.mkfrTokenAddress})`);
  console.log(`Target amount: 1000 MKFR`);
  console.log(`Status: 🟡 Funding (Atlas can test funding functionality)`);
  console.log(`Creation transaction: 0x0084deeda776ffc340cc8ac9ce2e977786114947ab0ebca575962f2acff14cc6`);
  
  // Pool 2 information and Merkle data
  const claimableData = await setupClaimablePool();
  
  console.log("\n✅ Pool 2: Claimable Test Pool");
  console.log(`Pool ID: 0x${CONFIG.pools.claimable.id.toString(16)}`);
  console.log(`Name: ${CONFIG.pools.claimable.name}`);
  console.log(`Token: MKFR (${CONFIG.mkfrTokenAddress})`);
  console.log(`Total amount: 10000 MKFR`);
  console.log(`Status: 🟢 Claimable (Atlas can test claim functionality)`);
  console.log(`Creation transaction: 0x063683a2643346c99eaf51020b20c093cef1e808639a414f7b824f03b1f117c4`);
  
  // finalize_epoch command
  console.log("\n🔧 Finalize Epoch Command:");
  console.log(`sncast invoke --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function finalize_epoch \\`);
  console.log(`  --calldata ${claimableData.poolId} 0 ${claimableData.epoch} ${claimableData.merkleRoot} ${claimableData.signature.r} ${claimableData.signature.s}`);
  
  // Frontend API data
  console.log("\n📱 Frontend Test Data:");
  console.log("```json");
  console.log(JSON.stringify({
    pools: {
      funding: {
        id: "0x" + CONFIG.pools.funding.id.toString(16),
        name: CONFIG.pools.funding.name,
        token: CONFIG.mkfrTokenAddress,
        targetAmount: "1000000000000000000000",
        status: "funding",
        deadline: Math.floor(Date.now() / 1000) + 1209600, // 14 days later
        refundAfter: Math.floor(Date.now() / 1000) + 1814400 // 21 days later
      },
      claimable: {
        id: "0x" + CONFIG.pools.claimable.id.toString(16), 
        name: CONFIG.pools.claimable.name,
        token: CONFIG.mkfrTokenAddress,
        totalAmount: "10000000000000000000000",
        status: "claimable",
        epoch: claimableData.epoch,
        merkleRoot: claimableData.merkleRoot,
        users: claimableData.proofs
      }
    },
    contracts: {
      kolEscrow: CONFIG.kolEscrowAddress,
      mkfrToken: CONFIG.mkfrTokenAddress
    }
  }, null, 2));
  console.log("```");
  
  console.log("\n🎯 Test Scenarios:");
  console.log("1. Funding Test: Use Pool 0x2001, Atlas can test approve + fund_pool_with_transfer");
  console.log("2. Claim Test: Use Pool 0x2002, all 4 users can test claim_epoch");
  console.log("3. Preview Test: Use preview_amount function to test amount calculation");
  console.log("4. Status Query: Test get_pool_info and other query functions");
  
  console.log("\n✨ Setup complete! Atlas frontend can start testing now!");
}

// Run
generateTestInfo().catch(console.error);
