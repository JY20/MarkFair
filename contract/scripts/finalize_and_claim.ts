import { ec, hash } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

// Inputs (replaceable)
const ESCROW =
  "0x04b172f0c5f1a23f582776ea5d33b2286d30a6da43537349d992d32ece3c63d6";
const TOKEN =
  "0x016ea887e416fe4b92a9dbb6ef8dba10ae108bbb4c8559f740d8105236aea4eb";
const BRAND =
  "0x01ea8da13e8ae65fe7e1fb368e174d50f1b9588305a4f12629c9eef467c4abee";
const POOL_ID = { low: 3n, high: 0n };
const EPOCH = 0n;

// Attester private key (demo only). In prod load from secure storage.
const ATTESTER_PRIV = ec.starkCurve.utils.randomPrivateKey();
const ATTESTER_PUB = ec.starkCurve.getStarkKey(ATTESTER_PRIV);

// 合约叶哈希: pedersen_hash_many([ 'KOL_LEAF_V1', ca, pool.low, pool.high, epoch, index.low, index.high, account, shares.low, shares.high, amount.low, amount.high ])
function shortStrHex(s: string): string {
  return "0x" + Buffer.from(s).toString("hex");
}

function pedersenMany(fields: string[]): string {
  let acc = "0x" + fields.length.toString(16);
  for (const f of fields) {
    acc = hash.computePedersenHash(acc, f);
  }
  return acc;
}

function buildLeafHash(
  index: bigint,
  account: string,
  shares: bigint,
  unitK: bigint
) {
  const amount = shares * unitK; // 64x64 -> 128, 合约低位相乘
  const fields = [
    shortStrHex("KOL_LEAF_V1"),
    ESCROW,
    "0x" + POOL_ID.low.toString(16),
    "0x" + POOL_ID.high.toString(16),
    "0x" + EPOCH.toString(16),
    "0x" + index.toString(16),
    "0x0",
    account,
    "0x" + shares.toString(16),
    "0x0",
    "0x" + amount.toString(16),
    "0x0",
  ];
  return pedersenMany(fields);
}

(async () => {
  // 单领取人: BRAND
  const unitK = 1_000_000_000_000_000n; // 1e15
  const shares = 100n; // amount = 1e17
  const leaf = buildLeafHash(0n, BRAND, shares, unitK);
  const tree = SimpleMerkleTree.of([leaf]);
  const root = tree.root;
  const proof = tree.getProof(0);

  // Domain hash for finalize_epoch: domain_hash_finalize_v2(pool_id, epoch, root, total_shares, unit_k, deadline_ts, nonce)
  const totalShares = shares; // single
  const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nonce = 0n;

  const expected = pedersenMany([
    "0x" + Buffer.from("KOL_FINALIZE_V1").toString("hex"),
    ESCROW,
    "0x" + POOL_ID.low.toString(16),
    "0x" + POOL_ID.high.toString(16),
    "0x" + EPOCH.toString(16),
    root,
    "0x" + totalShares.toString(16),
    "0x0",
    "0x" + unitK.toString(16),
    "0x0",
    "0x" + deadlineTs.toString(16),
    "0x" + nonce.toString(16),
  ]);

  const sig = ec.starkCurve.sign(expected, ATTESTER_PRIV) as unknown as {
    r: bigint;
    s: bigint;
  };

  console.log(
    JSON.stringify(
      {
        attester_pubkey: "0x" + ATTESTER_PUB,
        unit_k: unitK.toString(),
        total_shares: totalShares.toString(),
        deadline_ts: deadlineTs.toString(),
        root,
        msg_hash: expected,
        sig_r: "0x" + sig.r.toString(16),
        sig_s: "0x" + sig.s.toString(16),
        proof,
        leaf,
      },
      null,
      2
    )
  );
})();
