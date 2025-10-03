/**
 * =============================================================================
 * BACKEND MERKLE ROOT GENERATOR
 * =============================================================================
 *
 * Function: Provide Merkle Tree generation and signature functionality for backend FastAPI
 * Purpose: Backend generates merkle_root and ECDSA signature during finalize_epoch
 *
 * Core Features:
 * - Build Pedersen Merkle Tree based on user shares data
 * - Generate merkle_root that meets contract verification requirements
 * - Generate ECDSA signature required for finalize_epoch
 * - Generate proof data needed for each user's claim
 *
 * Usage Scenarios:
 * - After campaign ends, backend calculates all users' shares
 * - Call generateMerkleData() to generate merkle_root and signature
 * - Call contract's finalize_epoch
 * - Provide proof data for each user to frontend
 *
 * Process Flow:
 *   Step 5: Generate Pedersen Merkle & signature finalize
 *   Step 6: Provide proof data for users
 * =============================================================================
 */

import { hash, ec, shortString } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

// ===== Core Utility Functions =====

/**
 * Normalize hexadecimal string
 */
function normalizeHex(h) {
  if (typeof h === "bigint") h = "0x" + h.toString(16);
  if (typeof h === "number") h = "0x" + h.toString(16);
  if (typeof h !== "string") h = h.toString();
  if (!h.startsWith("0x")) h = "0x" + h;
  return h;
}

/**
 * Format for strk-merkle-tree library (ensure even length)
 */
function normalizeHexForLib(h) {
  const normalized = normalizeHex(h);
  return normalized.length % 2 === 0 ? normalized : "0x0" + normalized.slice(2);
}

/**
 * Pedersen multi-element hash (for domain_hash_finalize)
 */
function pedersenMany(fields) {
  let acc = "0x" + fields.length.toString(16);
  for (const f of fields) acc = hash.computePedersenHash(acc, f);
  return acc;
}

// ===== Merkle Tree Core Functions =====

/**
 * Compute secure hash (step 1) - corresponds to contract's compute_secure_hash
 * Domain-separated hash containing all parameters
 */
function computeSecureHash(pool_id, epoch, index, account, shares, amount) {
  const LEAF_TAG = shortString.encodeShortString("KOL_LEAF");

  // simulate Cairo's PedersenTrait::new(0).update_with(...).finalize()
  let state = "0x0";

  state = hash.computePedersenHash(state, LEAF_TAG);
  state = hash.computePedersenHash(state, normalizeHex(pool_id.low));
  state = hash.computePedersenHash(state, normalizeHex(pool_id.high));
  state = hash.computePedersenHash(state, normalizeHex(epoch));
  state = hash.computePedersenHash(state, normalizeHex(index));
  state = hash.computePedersenHash(state, "0x0"); // index.high
  state = hash.computePedersenHash(state, account);
  state = hash.computePedersenHash(state, normalizeHex(shares));
  state = hash.computePedersenHash(state, "0x0"); // shares.high
  state = hash.computePedersenHash(state, normalizeHex(amount));
  state = hash.computePedersenHash(state, "0x0"); // amount.high
  state = hash.computePedersenHash(state, "0x7"); // parameter count

  return normalizeHex(state);
}

/**
 * Compute leaf hash (step 2) - corresponds to contract's leaf_hash_pedersen
 * Standard OpenZeppelin format leaf hash
 */
function customLeafHash(leafData) {
  const [account, secureHash] = leafData;

  // simulate Cairo's PedersenTrait::new(0).update_with(...).finalize()
  let state = "0x0";

  state = hash.computePedersenHash(state, account);
  state = hash.computePedersenHash(state, secureHash);
  state = hash.computePedersenHash(state, "0x2"); // parameter count

  const finalized = state;
  const finalHash = hash.computePedersenHash("0x0", finalized);

  return normalizeHex(finalHash);
}

/**
 * Custom node hash function - corresponds to contract's PedersenCHasher
 * Numerically sorted commutative hash
 */
function customNodeHash(left, right) {
  const leftBig = BigInt(left);
  const rightBig = BigInt(right);

  let elements;
  if (leftBig < rightBig) {
    elements = [left, right, "0x2"];
  } else {
    elements = [right, left, "0x2"];
  }

  const serialized = elements.map((x) => normalizeHex(x));
  const result = hash.computeHashOnElements(serialized);
  return normalizeHexForLib(result);
}

// ===== Main API Functions =====

/**
 * Build Merkle Tree
 * @param {Array} users - User data array [{account: string, shares: bigint}, ...]
 * @param {Object} pool_id - Pool ID {low: bigint, high: bigint}
 * @param {bigint} epoch - Epoch number
 * @param {bigint} unit_k - Unit conversion rate (usually 1e18)
 * @returns {Object} Merkle Tree object
 */
function buildMerkleTree(
  users,
  pool_id,
  epoch,
  unit_k = 1_000_000_000_000_000_000n
) {
  // calculate leaf hash for each user
  const leafHashes = users.map((user, index) => {
    const amount = user.shares * unit_k;
    const secureHash = computeSecureHash(
      pool_id,
      epoch,
      BigInt(index),
      user.account,
      user.shares,
      amount
    );
    const leafHash = customLeafHash([user.account, secureHash]);
    return normalizeHexForLib(leafHash);
  });

  // use SimpleMerkleTree to build tree
  const tree = SimpleMerkleTree.of(leafHashes, { nodeHash: customNodeHash });

  // attach user data for subsequent processing
  tree.userData = users.map((user, index) => ({
    index: BigInt(index),
    account: user.account,
    shares: user.shares,
    amount: user.shares * unit_k,
    leafHash: leafHashes[index],
  }));

  return tree;
}

/**
 * Compute domain hash (for signing) - corresponds to contract's domain_hash_finalize
 * @param {string} contractAddress - Contract address
 * @param {Object} pool_id - Pool ID {low: bigint, high: bigint}
 * @param {bigint} epoch - Epoch number
 * @param {string} merkle_root - Merkle root
 * @param {bigint} total_shares - Total shares
 * @param {bigint} unit_k - Unit conversion rate
 * @param {bigint} deadline_ts - Deadline timestamp
 * @param {bigint} nonce - Nonce value
 * @returns {string} Domain hash
 */
function computeDomainHash(
  contractAddress,
  pool_id,
  epoch,
  merkle_root,
  total_shares,
  unit_k,
  deadline_ts,
  nonce
) {
  const fields = [];
  fields.push(shortString.encodeShortString("KOL_FINALIZE"));
  fields.push(contractAddress); // contract address
  fields.push(normalizeHex(pool_id.low));
  fields.push(normalizeHex(pool_id.high));
  fields.push(normalizeHex(epoch));
  fields.push(merkle_root);
  fields.push(normalizeHex(total_shares));
  fields.push("0x0"); // total_shares.high
  fields.push(normalizeHex(unit_k));
  fields.push("0x0"); // unit_k.high
  fields.push(normalizeHex(deadline_ts));
  fields.push(normalizeHex(nonce));

  return normalizeHex(pedersenMany(fields));
}

/**
 * Generate ECDSA signature
 * @param {string} privateKey - Attester private key
 * @param {string} domainHash - Domain hash
 * @returns {Object} Signature {r: string, s: string}
 */
function signFinalize(privateKey, domainHash) {
  const signature = ec.starkCurve.sign(domainHash, privateKey);
  return {
    r: normalizeHex(signature.r),
    s: normalizeHex(signature.s),
  };
}

// ===== Main Business Functions =====

/**
 * Generate complete Merkle data (main function called by backend)
 * @param {Object} params - Parameter object
 * @param {Array} params.users - User data [{account, shares}, ...]
 * @param {string} params.contractAddress - KolEscrow contract address
 * @param {Object} params.pool_id - Pool ID {low, high}
 * @param {bigint} params.epoch - Epoch number
 * @param {bigint} params.deadline_ts - Deadline timestamp
 * @param {bigint} params.nonce - Current nonce value
 * @param {string} params.attesterPrivateKey - Attester private key
 * @param {bigint} params.unit_k - Unit conversion rate (default 1e18)
 * @returns {Object} Complete Merkle data
 */
function generateMerkleData({
  users,
  contractAddress,
  pool_id,
  epoch,
  deadline_ts,
  nonce,
  attesterPrivateKey,
  unit_k = 1_000_000_000_000_000_000n,
}) {
  // 1. Build Merkle Tree
  const tree = buildMerkleTree(users, pool_id, epoch, unit_k);
  const merkle_root = tree.root;

  // 2. Calculate total shares
  const total_shares = users.reduce((sum, user) => sum + user.shares, 0n);

  // 3. Generate domain hash
  const domainHash = computeDomainHash(
    contractAddress,
    pool_id,
    epoch,
    merkle_root,
    total_shares,
    unit_k,
    deadline_ts,
    nonce
  );

  // 4. Generate signature
  const signature = signFinalize(attesterPrivateKey, domainHash);

  // 5. Generate proof for each user
  const userProofs = users.map((user, index) => {
    const proof = tree.getProof(index);
    return {
      index: BigInt(index),
      account: user.account,
      shares: user.shares,
      amount: user.shares * unit_k,
      proof: proof,
    };
  });

  return {
    // finalize_epoch call parameters
    finalize_params: {
      pool_id,
      epoch,
      merkle_root,
      total_shares,
      unit_k,
      deadline_ts,
      msg_hash: domainHash,
      r: signature.r,
      s: signature.s,
    },
    // user proof data
    user_proofs: userProofs,
    // debug information
    debug: {
      domain_hash: domainHash,
      signature,
      total_users: users.length,
      total_shares,
    },
  };
}

// ===== Usage Examples =====

/**
 * Example: How backend uses this module
 */
function exampleUsage() {
  // simulate backend data
  const users = [
    {
      account:
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
      shares: 7n, // KOL1 gets 7 shares (consistent with Pool 104 test data)
    },
    {
      account:
        "0x1ea8da13e8ae65fe7e1fb368e174d50f1b9588305a4f12629c9eef467c4abee",
      shares: 3n, // KOL2 gets 3 shares (consistent with Pool 104 test data)
    },
  ];

  const params = {
    users,
    contractAddress:
      "0x0496202f5f0622e0fa42a6fc63e81ecc717972cb9fb7374257f793422a4c2a78",
    pool_id: { low: 200n, high: 0n },
    epoch: 1n,
    deadline_ts: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours later
    nonce: 0n, // query current nonce from contract
    attesterPrivateKey:
      "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f",
    unit_k: 1_000_000_000_000_000_000n, // 1e18
  };

  // generate Merkle data
  const merkleData = generateMerkleData(params);

  console.log("=== Backend Merkle Data Generation Example ===");
  console.log("Merkle Root:", merkleData.finalize_params.merkle_root);
  console.log("Domain Hash:", merkleData.debug.domain_hash);
  console.log("Signature R:", merkleData.finalize_params.r);
  console.log("Signature S:", merkleData.finalize_params.s);
  console.log("Total Users:", merkleData.debug.total_users);
  console.log("Total Shares:", merkleData.debug.total_shares.toString());

  // user proof example
  console.log("\n=== User Proof Data ===");
  merkleData.user_proofs.forEach((userProof, i) => {
    console.log(`User ${i + 1}:`, {
      account: userProof.account,
      shares: userProof.shares.toString(),
      amount: userProof.amount.toString(),
      proof_length: userProof.proof.length,
    });
  });

  return merkleData;
}

// ===== Export Functions =====

export {
  // core API
  generateMerkleData,
  buildMerkleTree,
  computeDomainHash,
  signFinalize,

  // utility functions
  computeSecureHash,
  customLeafHash,
  customNodeHash,
  normalizeHex,
  normalizeHexForLib,
  pedersenMany,

  // examples
  exampleUsage,
};

// if running this script directly, execute example
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage();
}
