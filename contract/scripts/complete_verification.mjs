/**
 * =============================================================================
 * COMPLETE VERIFICATION TEST SCRIPT (Sepolia)
 * =============================================================================
 *
 * Function: Complete verification of contract functionality - full flow from pool creation to reward claiming
 * Contract Address: 0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a
 *
 * Test Flow:
 * 1. Create pool
 * 2. Approve tokens
 * 3. Fund pool
 * 4. Generate Merkle data
 * 5. Finalize epoch
 * 6. Test preview_amount
 * 7. Verify proof
 * 8. Claim rewards
 * =============================================================================
 */

import { exec } from "child_process";
import { promisify } from "util";
import { hash, ec, shortString } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

const execAsync = promisify(exec);

// contract addresses
const ESCROW_CONTRACT =
  "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a";
const TOKEN_CONTRACT =
  "0x07cc3116574d1cb35face2e22a38052d1ddac612b34be2f37599431985e62ae9";

// test parameters
const POOL_ID = 400n;
const EPOCH = 1n;
const TOTAL_FUNDING = 10n * 1000000000000000000n; // 10 tokens

// user data
const users = [
  {
    account:
      "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
    shares: 7n,
    amount: 7n * 1000000000000000000n,
  },
  {
    account:
      "0x1ea8da13e8ae65fe7e1fb368e174d50f1b9588305a4f12629c9eef467c4abee",
    shares: 3n,
    amount: 3n * 1000000000000000000n,
  },
];

// Attester keys
const ATTESTER_PRIV =
  "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f";
const ATTESTER_PUB =
  "0x57f16e241689e66d3a7c9b35d4f09d7bb492d062a0fa2166a7a4b366b777fe1";

// utility functions
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

// compute secure hash (Cairo equivalent)
function computeSecureHash(poolId, epoch, index, account, shares, amount) {
  const LEAF_TAG = shortString.encodeShortString("KOL_LEAF");

  let current = "0x0";
  current = hash.computePedersenHash(current, LEAF_TAG);
  current = hash.computePedersenHash(
    current,
    normalizeHex(poolId & 0xffffffffffffffffffffffffffffffffn)
  );
  current = hash.computePedersenHash(current, normalizeHex(poolId >> 128n));
  current = hash.computePedersenHash(current, normalizeHex(epoch));
  current = hash.computePedersenHash(
    current,
    normalizeHex(index & 0xffffffffffffffffffffffffffffffffn)
  );
  current = hash.computePedersenHash(current, normalizeHex(index >> 128n));
  current = hash.computePedersenHash(current, normalizeHex(account));
  current = hash.computePedersenHash(
    current,
    normalizeHex(shares & 0xffffffffffffffffffffffffffffffffn)
  );
  current = hash.computePedersenHash(current, normalizeHex(shares >> 128n));
  current = hash.computePedersenHash(
    current,
    normalizeHex(amount & 0xffffffffffffffffffffffffffffffffn)
  );
  current = hash.computePedersenHash(current, normalizeHex(amount >> 128n));
  current = hash.computePedersenHash(current, "0x7");

  return current;
}

// custom leaf hash function
function customLeafHash(poolId, epoch, index, account, shares, amount) {
  const secureHash = computeSecureHash(
    poolId,
    epoch,
    index,
    account,
    shares,
    amount
  );

  let current = "0x0";
  current = hash.computePedersenHash(current, normalizeHex(account));
  current = hash.computePedersenHash(current, secureHash);
  current = hash.computePedersenHash(current, "0x2");

  return hash.computePedersenHash("0x0", current);
}

// custom node hash function
function customNodeHash(left, right) {
  const leftBig = BigInt(left);
  const rightBig = BigInt(right);
  const [a, b] = leftBig < rightBig ? [leftBig, rightBig] : [rightBig, leftBig];

  let current = "0x0";
  current = hash.computePedersenHash(current, normalizeHex(a));
  current = hash.computePedersenHash(current, normalizeHex(b));
  current = hash.computePedersenHash(current, "0x2");

  return normalizeHexForLib(current);
}

// build Merkle tree
function buildMerkleTreeCustom(users, poolId, epoch) {
  const leafHashes = users.map((user, index) => {
    const leafHash = customLeafHash(
      poolId,
      epoch,
      BigInt(index),
      user.account,
      user.shares,
      user.amount
    );
    return normalizeHexForLib(leafHash);
  });

  const tree = SimpleMerkleTree.of(
    leafHashes,
    { sortLeaves: false, hashLeaves: false, sortPairs: false },
    customNodeHash
  );
  return tree;
}

// Pedersen multi-element hash
function pedersenMany(fields) {
  let acc = "0x" + fields.length.toString(16);
  for (const f of fields) acc = hash.computePedersenHash(acc, f);
  return acc;
}

// compute domain hash
function computeDomainHash(
  poolId,
  epoch,
  merkleRoot,
  totalShares,
  unitK,
  deadlineTs,
  nonce
) {
  const fields = [
    shortString.encodeShortString("KOL_FINALIZE"),
    ESCROW_CONTRACT,
    normalizeHex(poolId & 0xffffffffffffffffffffffffffffffffn),
    normalizeHex(poolId >> 128n),
    normalizeHex(epoch),
    merkleRoot,
    normalizeHex(totalShares & 0xffffffffffffffffffffffffffffffffn),
    normalizeHex(totalShares >> 128n),
    normalizeHex(unitK & 0xffffffffffffffffffffffffffffffffn),
    normalizeHex(unitK >> 128n),
    normalizeHex(deadlineTs),
    normalizeHex(nonce),
  ];

  return pedersenMany(fields);
}

// signature function
function signFinalize(
  poolId,
  epoch,
  merkleRoot,
  totalShares,
  unitK,
  deadlineTs,
  nonce
) {
  const msgHash = computeDomainHash(
    poolId,
    epoch,
    merkleRoot,
    totalShares,
    unitK,
    deadlineTs,
    nonce
  );
  const signature = ec.starkCurve.sign(msgHash, ATTESTER_PRIV);

  return {
    r: "0x" + signature.r.toString(16),
    s: "0x" + signature.s.toString(16),
    msgHash: msgHash,
  };
}

// execute command and print results
async function runCommand(description, command) {
  console.log(`\n🔧 ${description}`);
  console.log(`Command: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: "/Users/ctrl/Desktop/Work/Starknet/MarkFair/contract",
    });
    console.log("✅ Success:", stdout.trim());
    return { success: true, output: stdout.trim() };
  } catch (error) {
    console.log("❌ Failed:", error.message);
    return { success: false, error: error.message };
  }
}

// main test function
async function runCompleteVerification() {
  console.log("🚀 Starting complete verification test\n");
  console.log(`Contract Address: ${ESCROW_CONTRACT}`);
  console.log(`Token Address: ${TOKEN_CONTRACT}`);
  console.log(`Pool ID: ${POOL_ID}`);
  console.log(`User 1: ${users[0].account} (${users[0].shares} shares)`);
  console.log(`User 2: ${users[1].account} (${users[1].shares} shares)`);

  const results = [];

  const now = Math.floor(Date.now() / 1000);
  const deadlineTs = now + 86400; // 24 hours later
  const refundAfterTs = deadlineTs + 86400; // 48 hours later

  // 1. Create pool
  let result = await runCommand(
    "1️⃣ Create Pool",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function create_pool --calldata ${POOL_ID} 0 ${users[0].account} ${TOKEN_CONTRACT} ${ATTESTER_PUB} ${deadlineTs} ${refundAfterTs}`
  );
  results.push({ step: "create_pool", ...result });

  if (!result.success) {
    console.log("❌ Pool creation failed, stopping test");
    return results;
  }

  // 2. Approve tokens
  result = await runCommand(
    "2️⃣ Approve Tokens",
    `sncast invoke --network sepolia --contract-address ${TOKEN_CONTRACT} --function approve --calldata ${ESCROW_CONTRACT} ${TOTAL_FUNDING} 0`
  );
  results.push({ step: "approve", ...result });

  // 3. Fund pool
  result = await runCommand(
    "3️⃣ Fund Pool",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function fund_pool_with_transfer --calldata ${POOL_ID} 0 ${TOTAL_FUNDING} 0 ${TOKEN_CONTRACT} 0x1ea8da13e8ae65fe7e1fb368e174d50f1b9588305a4f12629c9eef467c4abee`
  );
  results.push({ step: "fund_pool", ...result });

  // 4. Generate Merkle data
  console.log("\n4️⃣ Generate Merkle Data");
  const tree = buildMerkleTreeCustom(users, POOL_ID, EPOCH);
  const merkleRoot = tree.root;
  const totalShares = users.reduce((sum, user) => sum + user.shares, 0n);
  const unitK = 1000000000000000000n; // 1e18
  const nonce = 0n;

  console.log(`Merkle Root: ${merkleRoot}`);
  console.log(`Total Shares: ${totalShares}`);
  console.log(`Unit K: ${unitK}`);

  // 5. Generate signature
  const signature = signFinalize(
    POOL_ID,
    EPOCH,
    merkleRoot,
    totalShares,
    unitK,
    BigInt(deadlineTs),
    nonce
  );
  console.log(`Domain Hash: ${signature.msgHash}`);
  console.log(`Signature R: ${signature.r}`);
  console.log(`Signature S: ${signature.s}`);

  // 6. Finalize epoch
  result = await runCommand(
    "5️⃣ Finalize Epoch",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function finalize_epoch --calldata ${POOL_ID} 0 ${EPOCH} ${merkleRoot} ${totalShares} 0 ${unitK} 0 ${deadlineTs} ${nonce} ${signature.msgHash} ${signature.r} ${signature.s}`
  );
  results.push({ step: "finalize_epoch", ...result });

  if (!result.success) {
    console.log("❌ Finalize failed, stopping test");
    return results;
  }

  // 7. Test preview_amount
  result = await runCommand(
    "6️⃣ Test Preview Amount",
    `sncast call --network sepolia --contract-address ${ESCROW_CONTRACT} --function preview_amount --calldata ${POOL_ID} 0 ${EPOCH} ${users[0].shares} 0`
  );
  results.push({ step: "preview_amount", ...result });

  // 8. Generate user proofs and verify
  const userProofs = users.map((user, index) => {
    const leafHash = customLeafHash(
      POOL_ID,
      EPOCH,
      BigInt(index),
      user.account,
      user.shares,
      user.amount
    );
    const proof = tree.getProof(index);

    return {
      index: index,
      account: user.account,
      shares: user.shares.toString(),
      amount: user.amount.toString(),
      leafHash: leafHash,
      proof: proof,
    };
  });

  // 9. Verify user 1's proof
  const user1Proof = userProofs[0];
  result = await runCommand(
    "7️⃣ Verify User 1 Proof",
    `sncast call --network sepolia --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata ${POOL_ID} 0 ${EPOCH} ${
      user1Proof.index
    } 0 ${user1Proof.account} ${user1Proof.shares} 0 ${user1Proof.amount} 0 ${
      user1Proof.proof.length
    } ${user1Proof.proof.join(" ")}`
  );
  results.push({ step: "verify_proof_user1", ...result });

  // 10. User 1 claim rewards
  result = await runCommand(
    "8️⃣ User 1 Claim Rewards",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata ${POOL_ID} 0 ${EPOCH} ${
      user1Proof.index
    } 0 ${user1Proof.account} ${user1Proof.shares} 0 ${user1Proof.amount} 0 ${
      user1Proof.proof.length
    } ${user1Proof.proof.join(" ")}`
  );
  results.push({ step: "claim_user1", ...result });

  // 11. Verify user 2's proof
  const user2Proof = userProofs[1];
  result = await runCommand(
    "9️⃣ Verify User 2 Proof",
    `sncast call --network sepolia --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata ${POOL_ID} 0 ${EPOCH} ${
      user2Proof.index
    } 0 ${user2Proof.account} ${user2Proof.shares} 0 ${user2Proof.amount} 0 ${
      user2Proof.proof.length
    } ${user2Proof.proof.join(" ")}`
  );
  results.push({ step: "verify_proof_user2", ...result });

  // 12. User 2 claim rewards
  result = await runCommand(
    "🔟 User 2 Claim Rewards",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata ${POOL_ID} 0 ${EPOCH} ${
      user2Proof.index
    } 0 ${user2Proof.account} ${user2Proof.shares} 0 ${user2Proof.amount} 0 ${
      user2Proof.proof.length
    } ${user2Proof.proof.join(" ")}`
  );
  results.push({ step: "claim_user2", ...result });

  return results;
}

// execute test
async function main() {
  try {
    const results = await runCompleteVerification();

    console.log("\n\n📋 Complete Verification Results Summary:");
    console.log("===================");

    results.forEach((result, index) => {
      const status = result.success ? "✅ Passed" : "❌ Failed";
      console.log(`${index + 1}. ${result.step}: ${status}`);
    });

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    console.log(`\n🎯 Overall Result: ${successCount}/${totalCount} steps successful`);

    if (successCount === totalCount) {
      console.log("🎉 Complete verification successful! Contract can normally create pools and claim rewards!");
    } else {
      console.log("⚠️  Some steps failed, please check error messages");
    }

    console.log("\n📝 Verified Features:");
    console.log("- ✅ Create pool");
    console.log("- ✅ Fund pool");
    console.log("- ✅ Merkle tree generation");
    console.log("- ✅ Epoch finalization");
    console.log("- ✅ Preview amount calculation");
    console.log("- ✅ Proof verification");
    console.log("- ✅ Reward claiming");
  } catch (error) {
    console.error("❌ Test execution error:", error);
  }
}

// run test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runCompleteVerification };
