/**
 * =============================================================================
 * ATLAS Complete Test Pool Setup Script (PTB version)
 * =============================================================================
 *
 * Function: Complete the entire Atlas test pool setup in one go
 * Includes: Authorization → Funding → Finalize → Generate Proof data
 *
 * Advantage: Uses a single transaction batch, avoiding authorization issues
 * =============================================================================
 */

import {
  hash,
  ec,
  shortString,
  CallData,
  RpcProvider,
  Account,
  Contract,
} from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

// ===== Configuration Information =====
const CONFIG = {
  // Network configuration
  rpcUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8",

  // Contract addresses
  kolEscrowAddress:
    "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a",
  mkfrTokenAddress:
    "0x075d470cb627938cb8f835fd01cab06b7fab0fbe4b2eeb2f6e6175edad0f98ec",

  // Atlas frontend 4-person test data
  users: [
    {
      name: "main/atlas",
      account:
        "0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930",
      shares: "2500000000000000000000", // 2500 MKFR
    },
    {
      name: "jimmy",
      account:
        "0x012B099F50C3CbCc82ccF7Ee557c9d60255c35C359eA6615435B761Ec3336EC8",
      shares: "2500000000000000000000", // 2500 MKFR
    },
    {
      name: "leo",
      account:
        "0x0299970bA982112ab018832b2875fF750409d5239c1Cc056e98402d8D53Bd148",
      shares: "2500000000000000000000", // 2500 MKFR
    },
    {
      name: "user4",
      account:
        "0x064167f58534A0D29EAb5e6813Cc116E6eC978009920108ee7aA15f0e8Ae7f2D",
      shares: "2500000000000000000000", // 2500 MKFR
    },
  ],

  // Attester key
  attesterSK:
    "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f",

  // Pool configuration
  poolId: 0x2002,
  epoch: 1,
  totalAmount: "10000000000000000000000", // 10000 MKFR
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
  const leaves = userData.map(({ account, shares }) =>
    customLeafHash(account, shares)
  );
  return new SimpleMerkleTree(leaves, customNodeHash);
}

function computeDomainHash(poolId, epoch) {
  const poolIdHex = normalizeHexForLib(poolId);
  const epochHex = normalizeHexForLib(epoch);
  return hash.pedersen([poolIdHex, epochHex]);
}

function signFinalize(poolId, epoch, merkleRoot, privateKey) {
  const domainHash = computeDomainHash(poolId, epoch);
  const messageHash = hash.pedersen([
    domainHash,
    normalizeHexForLib(merkleRoot),
  ]);
  const keyPair = ec.starkCurve.getStarkKey(privateKey);
  const signature = ec.starkCurve.sign(messageHash, privateKey);
  return [signature.r.toString(), signature.s.toString()];
}

// ===== Main Functions =====

async function generateCompleteSetup() {
  console.log("🏊‍♂️ Atlas Frontend Complete Test Pool Setup");
  console.log("=".repeat(50));

  // Generate Merkle tree
  console.log("\n🌳 Generating Merkle tree...");
  const merkleTree = buildMerkleTree(CONFIG.users);
  const merkleRoot = merkleTree.root;

  console.log(`Merkle Root: ${merkleRoot}`);

  // Generate signature
  console.log("\n✍️  Generating finalize signature...");
  const [r, s] = signFinalize(
    CONFIG.poolId,
    CONFIG.epoch,
    merkleRoot,
    CONFIG.attesterSK
  );

  console.log(`Signature R: ${r}`);
  console.log(`Signature S: ${s}`);

  // Generate user proof data
  console.log("\n🔐 Generating user proof data...");
  const proofs = {};
  CONFIG.users.forEach(({ name, account, shares }, index) => {
    const leaf = customLeafHash(account, shares);
    const proof = merkleTree.getProof(leaf);

    proofs[name] = {
      account,
      shares,
      proof: proof.map((p) => normalizeHex(p)),
    };

    console.log(`  ${name}:`);
    console.log(`    Address: ${account}`);
    console.log(
      `    Shares: ${shares} (${(
        BigInt(shares) / BigInt("1000000000000000000")
      ).toString()} MKFR)`
    );
    console.log(
      `    Proof: [${proof.map((p) => `"${normalizeHex(p)}"`).join(", ")}]`
    );
  });

  // Output complete command sequence
  console.log("\n🔧 Complete Setup Command Sequence:");
  console.log("=".repeat(50));

  console.log("\n1️⃣ Authorize Token:");
  console.log(`sncast invoke --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.mkfrTokenAddress} \\`);
  console.log(`  --function approve \\`);
  console.log(
    `  --calldata ${CONFIG.kolEscrowAddress} 0x21e19e0c9bab2400000 0x0`
  );

  console.log("\n2️⃣ Fund Pool:");
  console.log(`sncast invoke --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function fund_pool_with_transfer \\`);
  console.log(
    `  --calldata 0x${CONFIG.poolId.toString(16)} 0x0 ${
      CONFIG.mkfrTokenAddress
    } 0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930 0x21e19e0c9bab2400000 0x0`
  );

  console.log("\n3️⃣ Finalize Epoch:");
  console.log(`sncast invoke --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function finalize_epoch \\`);
  console.log(
    `  --calldata 0x${CONFIG.poolId.toString(16)} 0x0 ${
      CONFIG.epoch
    } ${merkleRoot} ${r} ${s}`
  );

  // Output test commands
  console.log("\n🧪 Test Commands:");
  console.log("=".repeat(50));

  console.log("\n📊 Query Pool Status:");
  console.log(`sncast call --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function get_pool_info \\`);
  console.log(`  --calldata 0x${CONFIG.poolId.toString(16)} 0x0`);

  console.log("\n💰 Preview Reward Amount (using jimmy as example):");
  console.log(`sncast call --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function preview_amount \\`);
  console.log(
    `  --calldata 0x${CONFIG.poolId.toString(16)} 0x0 ${
      CONFIG.epoch
    } 0x21e19e0c9bab2400000 0x0`
  );

  console.log("\n🎁 Claim Reward (using jimmy as example):");
  const jimmyProof = proofs.jimmy;
  console.log(`sncast invoke --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function claim_epoch \\`);
  console.log(
    `  --calldata 0x${CONFIG.poolId.toString(16)} 0x0 ${CONFIG.epoch} ${
      jimmyProof.account
    } ${jimmyProof.shares} ${jimmyProof.proof.length} ${jimmyProof.proof.join(
      " "
    )}`
  );

  // Output frontend JSON data
  console.log("\n📱 Frontend Test Data:");
  console.log("=".repeat(50));
  console.log("```json");
  console.log(
    JSON.stringify(
      {
        pools: {
          funding: {
            id: "0x2001",
            name: "Atlas_Funding_Test",
            token: CONFIG.mkfrTokenAddress,
            targetAmount: "1000000000000000000000",
            status: "funding",
            description: "待充值测试池 - Atlas可以测试充值功能",
          },
          claimable: {
            id: "0x" + CONFIG.poolId.toString(16),
            name: "Atlas_Claimable_Test",
            token: CONFIG.mkfrTokenAddress,
            totalAmount: CONFIG.totalAmount,
            status: "claimable",
            epoch: CONFIG.epoch,
            merkleRoot: merkleRoot,
            users: proofs,
            description: "Claimable test pool - All 4 users can test claim functionality",
          },
        },
        contracts: {
          kolEscrow: CONFIG.kolEscrowAddress,
          mkfrToken: CONFIG.mkfrTokenAddress,
        },
        testScenarios: [
          "Funding Test: Pool 0x2001 - approve + fund_pool_with_transfer",
          "Claim Test: Pool 0x2002 - claim_epoch (4 users)",
          "Preview Test: preview_amount function testing",
          "Status Query: get_pool_info and other query functions",
        ],
      },
      null,
      2
    )
  );
  console.log("```");

  console.log("\n✨ Setup complete! Atlas frontend can start testing now!");
  console.log("\n🎯 Test Steps:");
  console.log("1. Run the 3 commands above to complete pool setup");
  console.log("2. Configure frontend using the JSON data");
  console.log("3. Test funding functionality (Pool 0x2001)");
  console.log("4. Test claim functionality (Pool 0x2002, 4 users)");

  return {
    merkleRoot,
    signature: { r, s },
    proofs,
    commands: {
      approve: `sncast invoke --network sepolia --contract-address ${CONFIG.mkfrTokenAddress} --function approve --calldata ${CONFIG.kolEscrowAddress} 0x21e19e0c9bab2400000 0x0`,
      fund: `sncast invoke --network sepolia --contract-address ${
        CONFIG.kolEscrowAddress
      } --function fund_pool_with_transfer --calldata 0x${CONFIG.poolId.toString(
        16
      )} 0x0 ${
        CONFIG.mkfrTokenAddress
      } 0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930 0x21e19e0c9bab2400000 0x0`,
      finalize: `sncast invoke --network sepolia --contract-address ${
        CONFIG.kolEscrowAddress
      } --function finalize_epoch --calldata 0x${CONFIG.poolId.toString(
        16
      )} 0x0 ${CONFIG.epoch} ${merkleRoot} ${r} ${s}`,
    },
  };
}

// 运行
generateCompleteSetup().catch(console.error);
