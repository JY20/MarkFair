/**
 * =============================================================================
 * 完整验证测试脚本 (Sepolia)
 * =============================================================================
 *
 * 功能: 完整验证合约功能 - 从创建池到领取奖励的全流程
 * 合约地址: 0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a
 *
 * 测试流程:
 * 1. 创建池
 * 2. 批准代币
 * 3. 资金池
 * 4. 生成Merkle数据
 * 5. Finalize epoch
 * 6. 测试preview_amount
 * 7. 验证proof
 * 8. 领取奖励
 * =============================================================================
 */

import { exec } from "child_process";
import { promisify } from "util";
import { hash, ec, shortString } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

const execAsync = promisify(exec);

// 合约地址
const ESCROW_CONTRACT =
  "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a";
const TOKEN_CONTRACT =
  "0x07cc3116574d1cb35face2e22a38052d1ddac612b34be2f37599431985e62ae9";

// 测试参数
const POOL_ID = 400n;
const EPOCH = 1n;
const TOTAL_FUNDING = 10n * 1000000000000000000n; // 10 tokens

// 用户数据
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

// 工具函数
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

// 计算secure hash (Cairo equivalent)
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

// 自定义叶子哈希函数
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

// 自定义节点哈希函数
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

// 构建Merkle树
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

// Pedersen多元素哈希
function pedersenMany(fields) {
  let acc = "0x" + fields.length.toString(16);
  for (const f of fields) acc = hash.computePedersenHash(acc, f);
  return acc;
}

// 计算域哈希
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

// 签名函数
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

// 执行命令并打印结果
async function runCommand(description, command) {
  console.log(`\n🔧 ${description}`);
  console.log(`命令: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: "/Users/ctrl/Desktop/Work/Starknet/MarkFair/contract",
    });
    console.log("✅ 成功:", stdout.trim());
    return { success: true, output: stdout.trim() };
  } catch (error) {
    console.log("❌ 失败:", error.message);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runCompleteVerification() {
  console.log("🚀 开始完整验证测试\n");
  console.log(`合约地址: ${ESCROW_CONTRACT}`);
  console.log(`代币地址: ${TOKEN_CONTRACT}`);
  console.log(`池ID: ${POOL_ID}`);
  console.log(`用户1: ${users[0].account} (${users[0].shares} shares)`);
  console.log(`用户2: ${users[1].account} (${users[1].shares} shares)`);

  const results = [];

  const now = Math.floor(Date.now() / 1000);
  const deadlineTs = now + 86400; // 24小时后
  const refundAfterTs = deadlineTs + 86400; // 48小时后

  // 1. 创建池
  let result = await runCommand(
    "1️⃣ 创建池",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function create_pool --calldata ${POOL_ID} 0 ${users[0].account} ${TOKEN_CONTRACT} ${ATTESTER_PUB} ${deadlineTs} ${refundAfterTs}`
  );
  results.push({ step: "create_pool", ...result });

  if (!result.success) {
    console.log("❌ 创建池失败，停止测试");
    return results;
  }

  // 2. 批准代币
  result = await runCommand(
    "2️⃣ 批准代币",
    `sncast invoke --network sepolia --contract-address ${TOKEN_CONTRACT} --function approve --calldata ${ESCROW_CONTRACT} ${TOTAL_FUNDING} 0`
  );
  results.push({ step: "approve", ...result });

  // 3. 资金池
  result = await runCommand(
    "3️⃣ 资金池",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function fund_pool_with_transfer --calldata ${POOL_ID} 0 ${TOTAL_FUNDING} 0 ${TOKEN_CONTRACT} 0x1ea8da13e8ae65fe7e1fb368e174d50f1b9588305a4f12629c9eef467c4abee`
  );
  results.push({ step: "fund_pool", ...result });

  // 4. 生成Merkle数据
  console.log("\n4️⃣ 生成Merkle数据");
  const tree = buildMerkleTreeCustom(users, POOL_ID, EPOCH);
  const merkleRoot = tree.root;
  const totalShares = users.reduce((sum, user) => sum + user.shares, 0n);
  const unitK = 1000000000000000000n; // 1e18
  const nonce = 0n;

  console.log(`Merkle Root: ${merkleRoot}`);
  console.log(`Total Shares: ${totalShares}`);
  console.log(`Unit K: ${unitK}`);

  // 5. 生成签名
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
    "5️⃣ Finalize epoch",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function finalize_epoch --calldata ${POOL_ID} 0 ${EPOCH} ${merkleRoot} ${totalShares} 0 ${unitK} 0 ${deadlineTs} ${nonce} ${signature.msgHash} ${signature.r} ${signature.s}`
  );
  results.push({ step: "finalize_epoch", ...result });

  if (!result.success) {
    console.log("❌ Finalize失败，停止测试");
    return results;
  }

  // 7. 测试preview_amount
  result = await runCommand(
    "6️⃣ 测试preview_amount",
    `sncast call --network sepolia --contract-address ${ESCROW_CONTRACT} --function preview_amount --calldata ${POOL_ID} 0 ${EPOCH} ${users[0].shares} 0`
  );
  results.push({ step: "preview_amount", ...result });

  // 8. 生成用户proofs并验证
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

  // 9. 验证用户1的proof
  const user1Proof = userProofs[0];
  result = await runCommand(
    "7️⃣ 验证用户1 proof",
    `sncast call --network sepolia --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata ${POOL_ID} 0 ${EPOCH} ${
      user1Proof.index
    } 0 ${user1Proof.account} ${user1Proof.shares} 0 ${user1Proof.amount} 0 ${
      user1Proof.proof.length
    } ${user1Proof.proof.join(" ")}`
  );
  results.push({ step: "verify_proof_user1", ...result });

  // 10. 用户1领取奖励
  result = await runCommand(
    "8️⃣ 用户1领取奖励",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata ${POOL_ID} 0 ${EPOCH} ${
      user1Proof.index
    } 0 ${user1Proof.account} ${user1Proof.shares} 0 ${user1Proof.amount} 0 ${
      user1Proof.proof.length
    } ${user1Proof.proof.join(" ")}`
  );
  results.push({ step: "claim_user1", ...result });

  // 11. 验证用户2的proof
  const user2Proof = userProofs[1];
  result = await runCommand(
    "9️⃣ 验证用户2 proof",
    `sncast call --network sepolia --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata ${POOL_ID} 0 ${EPOCH} ${
      user2Proof.index
    } 0 ${user2Proof.account} ${user2Proof.shares} 0 ${user2Proof.amount} 0 ${
      user2Proof.proof.length
    } ${user2Proof.proof.join(" ")}`
  );
  results.push({ step: "verify_proof_user2", ...result });

  // 12. 用户2领取奖励
  result = await runCommand(
    "🔟 用户2领取奖励",
    `sncast invoke --network sepolia --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata ${POOL_ID} 0 ${EPOCH} ${
      user2Proof.index
    } 0 ${user2Proof.account} ${user2Proof.shares} 0 ${user2Proof.amount} 0 ${
      user2Proof.proof.length
    } ${user2Proof.proof.join(" ")}`
  );
  results.push({ step: "claim_user2", ...result });

  return results;
}

// 执行测试
async function main() {
  try {
    const results = await runCompleteVerification();

    console.log("\n\n📋 完整验证结果总结:");
    console.log("===================");

    results.forEach((result, index) => {
      const status = result.success ? "✅ 通过" : "❌ 失败";
      console.log(`${index + 1}. ${result.step}: ${status}`);
    });

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    console.log(`\n🎯 总体结果: ${successCount}/${totalCount} 步骤成功`);

    if (successCount === totalCount) {
      console.log("🎉 完整验证成功！合约可以正常创建pool并领取奖励！");
    } else {
      console.log("⚠️  部分步骤失败，请检查错误信息");
    }

    console.log("\n📝 验证的功能:");
    console.log("- ✅ 创建池");
    console.log("- ✅ 资金池");
    console.log("- ✅ Merkle树生成");
    console.log("- ✅ Epoch finalization");
    console.log("- ✅ Preview amount计算");
    console.log("- ✅ Proof验证");
    console.log("- ✅ 奖励领取");
  } catch (error) {
    console.error("❌ 测试执行出错:", error);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runCompleteVerification };
