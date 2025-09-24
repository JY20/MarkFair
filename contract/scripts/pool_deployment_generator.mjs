import { hash, ec, shortString } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

// 明确的attester密钥对
const ATTESTER_PRIV =
  "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f";
const ATTESTER_PUB = ec.starkCurve.getStarkKey(ATTESTER_PRIV);

console.log("=== 完整端到端验证 ===");
console.log(`使用的attester私钥: ${ATTESTER_PRIV}`);
console.log(`对应的attester公钥: ${ATTESTER_PUB}`);

// 合约地址
const ESCROW_CONTRACT =
  "0x00b1642b76869266f123541e896a5c51a38d80c8da6337be11f6aaffbc9d883a";
const TOKEN_CONTRACT =
  "0x02782e5d032ef7a97d969cd19fdf25160d4c6131c7f3e6cbdca2f1435fe230f7";
const BRAND =
  "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

// 使用新的pool参数
const POOL_ID = { low: 25n, high: 0n }; // 全新的pool ID
const EPOCH = 1n;

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

// 修复后的哈希函数
function computeSecureHash(pool_id, epoch, index, account, shares, unitK) {
  const amount = shares * unitK;
  const LEAF_TAG = shortString.encodeShortString("KOL_LEAF");

  let state = "0x0";
  state = hash.computePedersenHash(state, LEAF_TAG);
  state = hash.computePedersenHash(state, normalizeHex(pool_id.low));
  state = hash.computePedersenHash(state, normalizeHex(pool_id.high));
  state = hash.computePedersenHash(state, normalizeHex(epoch));
  state = hash.computePedersenHash(state, normalizeHex(index));
  state = hash.computePedersenHash(state, "0x0");
  state = hash.computePedersenHash(state, account);
  state = hash.computePedersenHash(state, normalizeHex(shares));
  state = hash.computePedersenHash(state, "0x0");
  state = hash.computePedersenHash(state, normalizeHex(amount));
  state = hash.computePedersenHash(state, "0x0");
  state = hash.computePedersenHash(state, "0x7");

  return normalizeHex(state);
}

function customLeafHash(leafData) {
  const [account, secureHash] = leafData;
  let state = "0x0";
  state = hash.computePedersenHash(state, account);
  state = hash.computePedersenHash(state, secureHash);
  state = hash.computePedersenHash(state, "0x2");
  const finalized = state;
  const finalHash = hash.computePedersenHash("0x0", finalized);
  return normalizeHex(finalHash);
}

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

function buildMerkleTree(users, pool_id, epoch) {
  const unitK = 1_000_000_000_000_000_000n;
  const leafHashes = users.map((user, index) => {
    const secureHash = computeSecureHash(
      pool_id,
      epoch,
      BigInt(index),
      user.account,
      user.shares,
      unitK
    );
    const leafHash = customLeafHash([user.account, secureHash]);
    return normalizeHexForLib(leafHash);
  });

  const tree = SimpleMerkleTree.of(leafHashes, { nodeHash: customNodeHash });
  tree.userData = users.map((user, index) => ({
    index: BigInt(index),
    account: user.account,
    shares: user.shares,
    amount: user.shares * unitK,
    leafHash: leafHashes[index],
  }));

  return tree;
}

function pedersenMany(fields) {
  let acc = "0x" + fields.length.toString(16);
  for (const f of fields) acc = hash.computePedersenHash(acc, f);
  return acc;
}

function computeDomainHash(
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
  fields.push(ESCROW_CONTRACT);
  fields.push(normalizeHex(pool_id.low));
  fields.push(normalizeHex(pool_id.high));
  fields.push(normalizeHex(epoch));
  fields.push(merkle_root);
  fields.push(normalizeHex(total_shares.low));
  fields.push(normalizeHex(total_shares.high));
  fields.push(normalizeHex(unit_k.low));
  fields.push(normalizeHex(unit_k.high));
  fields.push(normalizeHex(deadline_ts));
  fields.push(normalizeHex(nonce));

  return normalizeHex(pedersenMany(fields));
}

// 测试数据
const users = [
  {
    account:
      "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
    shares: 7500n,
  },
  { account: "0x00078662e7352d062084b0010068b99288486c2d8b", shares: 2500n },
];

console.log("\n=== 步骤1: 构建Merkle Tree ===");
const tree = buildMerkleTree(users, POOL_ID, EPOCH);
const merkleRoot = normalizeHex(tree.root);
console.log(`Merkle Root: ${merkleRoot}`);

// 生成参数
const total_shares = { low: 10000n, high: 0n };
const unit_k = { low: 1000000000000000000n, high: 0n };
const deadline_ts = 2100000000n; // 远期时间
const nonce = 0n;

const msgHash = computeDomainHash(
  POOL_ID,
  EPOCH,
  merkleRoot,
  total_shares,
  unit_k,
  deadline_ts,
  nonce
);
const signature = ec.starkCurve.sign(msgHash, ATTESTER_PRIV);

console.log(`Domain hash: ${msgHash}`);
console.log(`Signature r: ${normalizeHex(signature.r)}`);
console.log(`Signature s: ${normalizeHex(signature.s)}`);

// 生成proofs
const proof1 = tree.getProof(0);
const proof2 = tree.getProof(1);
const user1Data = tree.userData[0];
const user2Data = tree.userData[1];

console.log("\n=== 执行步骤 ===");

console.log("\n1️⃣ 创建pool:");
const createPoolCmd = `sncast --profile local invoke --contract-address ${ESCROW_CONTRACT} --function create_pool --calldata ${
  POOL_ID.low
} ${POOL_ID.high} ${BRAND} ${TOKEN_CONTRACT} ${ATTESTER_PUB} ${deadline_ts} ${
  deadline_ts + 100000000n
}`;
console.log(createPoolCmd);

console.log("\n2️⃣ 充值pool:");
const fundPoolCmd = `sncast --profile local invoke --contract-address ${ESCROW_CONTRACT} --function fund_pool_with_transfer --calldata ${POOL_ID.low} ${POOL_ID.high} ${TOKEN_CONTRACT} ${BRAND} ${total_shares.low} ${total_shares.high}`;
console.log(fundPoolCmd);

console.log("\n3️⃣ Finalize epoch:");
const finalizeCmd = `sncast --profile local invoke --contract-address ${ESCROW_CONTRACT} --function finalize_epoch --calldata ${
  POOL_ID.low
} ${POOL_ID.high} ${EPOCH} ${merkleRoot} ${total_shares.low} ${
  total_shares.high
} ${unit_k.low} ${unit_k.high} ${deadline_ts} ${ATTESTER_PUB} ${normalizeHex(
  signature.r
)} ${normalizeHex(signature.s)}`;
console.log(finalizeCmd);

console.log("\n4️⃣ 验证User1 proof:");
const verifyCmd1 = `sncast --profile local call --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata ${
  POOL_ID.low
} ${POOL_ID.high} ${EPOCH} ${user1Data.index} 0 ${user1Data.account} ${
  user1Data.shares
} 0 ${user1Data.amount} 0 ${proof1.length} ${proof1.join(" ")}`;
console.log(verifyCmd1);

console.log("\n5️⃣ 验证User2 proof:");
const verifyCmd2 = `sncast --profile local call --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata ${
  POOL_ID.low
} ${POOL_ID.high} ${EPOCH} ${user2Data.index} 0 ${user2Data.account} ${
  user2Data.shares
} 0 ${user2Data.amount} 0 ${proof2.length} ${proof2.join(" ")}`;
console.log(verifyCmd2);

console.log("\n6️⃣ User1 领取:");
const claimCmd1 = `sncast --profile local invoke --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata ${
  POOL_ID.low
} ${POOL_ID.high} ${EPOCH} ${user1Data.index} 0 ${user1Data.account} ${
  user1Data.shares
} 0 ${user1Data.amount} 0 ${proof1.length} ${proof1.join(" ")}`;
console.log(claimCmd1);

console.log("\n7️⃣ User2 领取:");
const claimCmd2 = `sncast --profile local invoke --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata ${
  POOL_ID.low
} ${POOL_ID.high} ${EPOCH} ${user2Data.index} 0 ${user2Data.account} ${
  user2Data.shares
} 0 ${user2Data.amount} 0 ${proof2.length} ${proof2.join(" ")}`;
console.log(claimCmd2);

console.log("\n=== 保存密钥信息 ===");
console.log(`Pool ID: ${POOL_ID.low}`);
console.log(`Attester Private Key: ${ATTESTER_PRIV}`);
console.log(`Attester Public Key: ${ATTESTER_PUB}`);
console.log(`Merkle Root: ${merkleRoot}`);
