/**
 * =============================================================================
 * DEVNET MERKLE TREE GENERATOR
 * =============================================================================
 *
 * Function: Generate Merkle Tree and signature data for devnet environment
 * Purpose: Local development testing, quick generation of test parameters
 *
 * Main Features:
 * - Automatically generate and save attester key
 * - Build Merkle Tree for two users (7500+2500 token allocation)
 * - Generate ECDSA signature for finalize_epoch
 * - Output complete test parameters to out.json file
 * - Use devnet local contract addresses
 *
 * Usage:
 *   cd scripts/
 *   node devnet_merkle_generator.mjs
 *
 * Output file: out.json (contains all test parameters and proofs)
 * Environment: Devnet local development environment
 * =============================================================================
 */

import { ec, hash, shortString } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";
import fs from "node:fs";

// Addresses (updated for devnet - final version with standard leaf hash)
const ESCROW =
  "0x00b1642b76869266f123541e896a5c51a38d80c8da6337be11f6aaffbc9d883a";
const TOKEN =
  "0x02782e5d032ef7a97d969cd19fdf25160d4c6131c7f3e6cbdca2f1435fe230f7";
const BRAND =
  "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"; // devnet account (padded)
const BRAND2 = "0x00078662e7352d062084b0010068b99288486c2d8b"; // devnet account2 (padded)

const POOL_LOW = 13n; // pool_id = 13
const POOL_HIGH = 0n;
const EPOCH = 12n;

// Demo attester key (persist to reuse)
let ATTESTER_PRIV;
const keyPath = new URL("./attester.key", import.meta.url);
try {
  ATTESTER_PRIV = fs.readFileSync(keyPath, "utf8").trim();
} catch (_) {
  const k = ec.starkCurve.utils.randomPrivateKey();
  const hex = Array.from(k)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  ATTESTER_PRIV = "0x" + hex;
  fs.writeFileSync(keyPath, ATTESTER_PRIV);
}
const ATTESTER_PUB = ec.starkCurve.getStarkKey(ATTESTER_PRIV);

function normalizeHex(h) {
  if (typeof h === "bigint") h = "0x" + h.toString(16);
  if (typeof h === "number") h = "0x" + h.toString(16);
  if (typeof h !== "string") h = h.toString();
  if (!h.startsWith("0x")) h = "0x" + h;
  // maintain original length for hash calculation
  return h;
}

function normalizeHexForLib(h) {
  const normalized = normalizeHex(h);
  // add leading zeros for strk-merkle-tree library to ensure even length
  return normalized.length % 2 === 0 ? normalized : "0x0" + normalized.slice(2);
}

function shortStrHex(s) {
  return normalizeHex(shortString.encodeShortString(s));
}

function pedersenMany(fields) {
  // contract pedersen_hash_many: acc starts from length, then pedersen each item
  let acc = "0x" + fields.length.toString(16);
  for (const f of fields) acc = hash.computePedersenHash(acc, f);
  return acc;
}

// Pedersen node hash (paired by numerical ascending order) to match contract verify::<PedersenCHasher>
function pedersenNodeHash(a, b) {
  const aa = BigInt(a);
  const bb = BigInt(b);
  const [l, r] = aa <= bb ? [a, b] : [b, a];
  return normalizeHex(hash.computeHashOnElements([l, r]));
}

// compute secure hash containing all parameters (step 1), using domain tag
function computeSecureHash(pool_id, epoch, index, account, shares, unitK) {
  const amount = shares * unitK;
  const LEAF_TAG = shortString.encodeShortString("KOL_LEAF");

  // fix: use consecutive pedersen calls to simulate PedersenTrait::new(0)
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
  state = hash.computePedersenHash(state, "0x7"); // Parameter count

  return normalizeHex(state);
}

// custom leaf hash function, precisely matching contract's leaf_hash_pedersen
function customLeafHash(leafData) {
  const [account, secureHash] = leafData;

  // fix: use consecutive pedersen calls to simulate PedersenTrait::new(0)
  let state = "0x0";

  state = hash.computePedersenHash(state, account);
  state = hash.computePedersenHash(state, secureHash);
  state = hash.computePedersenHash(state, "0x2");

  const finalized = state;
  const finalHash = hash.computePedersenHash("0x0", finalized);

  return normalizeHex(finalHash);
}

// custom node hash function, precisely matching OpenZeppelin's PedersenCHasher
function customNodeHash(left, right) {
  // precisely match Cairo implementation:
  // if a < b { hash_state.update(a).update(b).update(2).finalize() }
  // else { hash_state.update(b).update(a).update(2).finalize() }

  // convert to BigInt for numerical comparison (matching Cairo's felt252 comparison)
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

// use SimpleMerkleTree with custom hash functions
function buildMerkleTreeCustom(users, pool_id, epoch) {
  const unitK = 1_000_000_000_000_000_000n; // 1e18

  // calculate leaf hash for each user
  const leafHashes = users.map((user, index) => {
    const secureHash = computeSecureHash(
      pool_id,
      epoch,
      BigInt(index),
      user.account,
      user.shares,
      unitK
    );
    // directly calculate leaf hash and format for library
    const leafHash = customLeafHash([user.account, secureHash]);
    return normalizeHexForLib(leafHash);
  });

  // use SimpleMerkleTree
  const tree = SimpleMerkleTree.of(leafHashes, { nodeHash: customNodeHash });

  // for compatibility with original interface, we need to add some methods
  tree.originalData = users.map((user, index) => {
    const secureHash = computeSecureHash(
      pool_id,
      epoch,
      BigInt(index),
      user.account,
      user.shares,
      unitK
    );
    return [user.account, secureHash];
  });

  return tree;
}

async function main() {
  const unitK = 1_000_000_000_000_000_000n; // 1e18
  const shares1 = 7_500n;
  const shares2 = 2_500n;
  const pool_id = { low: POOL_LOW, high: POOL_HIGH };

  // User data
  const users = [
    { account: BRAND, shares: shares1 },
    { account: BRAND2, shares: shares2 },
  ];

  // use new standard Merkle Tree implementation
  const tree = buildMerkleTreeCustom(users, pool_id, EPOCH);
  const root = tree.root;

  // get proof - SimpleMerkleTree uses different interface
  let proof, proof2;

  // find corresponding user indices
  let user1Index = -1,
    user2Index = -1;
  for (let i = 0; i < tree.originalData.length; i++) {
    if (tree.originalData[i][0] === BRAND) {
      user1Index = i;
      proof = tree.getProof(i);
    }
    if (tree.originalData[i][0] === BRAND2) {
      user2Index = i;
      proof2 = tree.getProof(i);
    }
  }

  const totalShares = shares1 + shares2; // 10000
  const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nonce = 1n; // Current nonce is 1

  const expected = pedersenMany([
    shortStrHex("KOL_FINALIZE"),
    ESCROW,
    "0x" + POOL_LOW.toString(16),
    "0x" + POOL_HIGH.toString(16),
    "0x" + EPOCH.toString(16),
    root,
    "0x" + totalShares.toString(16),
    "0x0",
    "0x" + unitK.toString(16),
    "0x0",
    "0x" + deadlineTs.toString(16),
    "0x" + nonce.toString(16),
  ]);

  const sig = ec.starkCurve.sign(expected, ATTESTER_PRIV);

  // local validation: use SimpleMerkleTree verification
  const leaf1 = customLeafHash([
    BRAND,
    computeSecureHash(
      pool_id,
      EPOCH,
      0n,
      BRAND,
      shares1,
      1_000_000_000_000_000_000n
    ),
  ]);
  const leaf2 = customLeafHash([
    BRAND2,
    computeSecureHash(
      pool_id,
      EPOCH,
      1n,
      BRAND2,
      shares2,
      1_000_000_000_000_000_000n
    ),
  ]);

  const local_ok1 = tree.verify(user1Index, proof);
  const local_ok2 = tree.verify(user2Index, proof2);

  const out = {
    escrow: ESCROW,
    token: TOKEN,
    brand: BRAND,
    pool_id: { low: POOL_LOW.toString(), high: POOL_HIGH.toString() },
    epoch: EPOCH.toString(),
    attester_priv: ATTESTER_PRIV,
    attester_pubkey: normalizeHex(ATTESTER_PUB),
    unit_k: unitK.toString(),
    total_shares: totalShares.toString(),
    deadline_ts: deadlineTs.toString(),
    root,
    msg_hash: expected,
    sig_r: "0x" + sig.r.toString(16),
    sig_s: "0x" + sig.s.toString(16),
    proof,
    proof2,
    proof_len: proof.length,
    local_ok1,
    local_ok2,
    index: "0",
    shares: { low: shares1.toString(), high: "0" },
    amount: {
      low: (shares1 * 1_000_000_000_000_000_000n).toString(),
      high: "0",
    },
    account: BRAND,
    second: {
      index: "1",
      account: BRAND2,
      shares: { low: shares2.toString(), high: "0" },
      amount: {
        low: (shares2 * 1_000_000_000_000_000_000n).toString(),
        high: "0",
      },
    },
  };

  fs.writeFileSync(
    new URL("./out.json", import.meta.url),
    JSON.stringify(out, null, 2)
  );
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
