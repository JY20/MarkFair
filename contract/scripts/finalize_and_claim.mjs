import { ec, hash, shortString } from "starknet";
import { StandardMerkleTree } from "@ericnordelo/strk-merkle-tree";
import fs from "node:fs";

// Addresses (updated for Sepolia testnet)
const ESCROW =
  "0x0542602e67fee6bfbea8368b83f1933ede566c94ef37624bec6a60c7831d2115";
const TOKEN =
  "0x015d942cee86bb00aee0b17aeb6dddb8de07074284a365505960f244ffe44a95";
const BRAND =
  "0x1ea8da13e8ae65fe7e1fb368e174d50f1b9588305a4f12629c9eef467c4abee"; // sepolia账户
const BRAND2 =
  "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"; // account-1账户

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
  if (!h.startsWith("0x")) h = "0x" + h;
  return h.length % 2 === 0 ? h : "0x0" + h.slice(2);
}

function shortStrHex(s) {
  return normalizeHex(shortString.encodeShortString(s));
}

function pedersenMany(fields) {
  // 合约 pedersen_hash_many：acc 从长度开始，逐项 pedersen
  let acc = "0x" + fields.length.toString(16);
  for (const f of fields) acc = hash.computePedersenHash(acc, f);
  return acc;
}

// Pedersen 节点哈希（按数值升序配对）以匹配合约 verify::<PedersenCHasher>
function pedersenNodeHash(a, b) {
  const aa = BigInt(a);
  const bb = BigInt(b);
  const [l, r] = aa <= bb ? [a, b] : [b, a];
  return normalizeHex(hash.computeHashOnElements([l, r]));
}

function buildLeafHash(index, account, shares, unitK) {
  const amount = shares * unitK; // 64x64 -> 128, high=0 in contract
  // 匹配合约中的 leaf_hash_pedersen 实现：
  // acc = pedersen(0, account)
  // acc = pedersen(acc, amount.low)
  // acc = pedersen(acc, 2)
  // result = pedersen(0, acc)
  let acc = "0x0";
  acc = hash.computePedersenHash(acc, account);
  acc = hash.computePedersenHash(acc, "0x" + amount.toString(16));
  acc = hash.computePedersenHash(acc, "0x2");
  return normalizeHex(hash.computePedersenHash("0x0", acc));
}

async function main() {
  const unitK = 1_000_000_000_000_000_000n; // 1e18
  const shares1 = 7_500n;
  const shares2 = 2_500n;
  const index = 0n;

  const leaf1 = buildLeafHash(index, BRAND, shares1, unitK);
  const leaf2 = buildLeafHash(1n, BRAND2, shares2, unitK);

  // 手动构建merkle tree，因为我们需要使用自定义的leaf hash
  const leaves = [leaf1, leaf2];

  // 对叶子进行排序以匹配合约中的PedersenCHasher行为
  const sortedLeaves = [...leaves].sort((a, b) => {
    const aa = BigInt(a);
    const bb = BigInt(b);
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });

  // 构建简单的两叶子merkle tree
  const root = pedersenNodeHash(sortedLeaves[0], sortedLeaves[1]);

  // 生成proof
  const leaf1Index = sortedLeaves.indexOf(leaf1);
  const leaf2Index = sortedLeaves.indexOf(leaf2);

  const proof = leaf1Index === 0 ? [sortedLeaves[1]] : [sortedLeaves[0]];
  const proof2 = leaf2Index === 0 ? [sortedLeaves[1]] : [sortedLeaves[0]];

  const totalShares = shares1 + shares2; // 10000
  const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nonce = 0n; // Sepolia上的nonce是0

  const expected = pedersenMany([
    shortStrHex("KOL_FINALIZE_V1"),
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

  // 本地校验：手动验证merkle proof
  function verifyProof(root, leaf, proof) {
    let current = leaf;
    for (const sibling of proof) {
      current = pedersenNodeHash(current, sibling);
    }
    return current === root;
  }

  const local_ok1 = verifyProof(root, leaf1, proof);
  const local_ok2 = verifyProof(root, leaf2, proof2);

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
    index: index.toString(),
    shares: { low: shares1.toString(), high: "0" },
    amount: { low: (shares1 * unitK).toString(), high: "0" },
    account: BRAND,
    second: {
      index: "1",
      account: BRAND2,
      shares: { low: shares2.toString(), high: "0" },
      amount: { low: (shares2 * unitK).toString(), high: "0" },
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
