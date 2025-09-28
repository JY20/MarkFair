/**
 * =============================================================================
 * 后端 MERKLE ROOT 生成器
 * =============================================================================
 *
 * 功能: 为后端FastAPI提供Merkle Tree生成和签名功能
 * 用途: 后端在finalize_epoch时生成merkle_root和ECDSA签名
 *
 * 核心功能:
 * - 根据用户shares数据构建Pedersen Merkle Tree
 * - 生成符合合约验证的merkle_root
 * - 生成finalize_epoch所需的ECDSA签名
 * - 为每个用户生成claim时需要的proof
 *
 * 使用场景:
 * - 活动结束后，后端计算完所有用户的shares
 * - 调用generateMerkleData()生成merkle_root和签名
 * - 调用合约的finalize_epoch
 * - 为前端提供每个用户的proof数据
 *
 * 流程对应:
 *   步骤5: 生成 Pedersen Merkle & 签名 finalize
 *   步骤6: 为用户提供proof数据
 * =============================================================================
 */

import { hash, ec, shortString } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

// ===== 核心工具函数 =====

/**
 * 标准化十六进制字符串
 */
function normalizeHex(h) {
  if (typeof h === "bigint") h = "0x" + h.toString(16);
  if (typeof h === "number") h = "0x" + h.toString(16);
  if (typeof h !== "string") h = h.toString();
  if (!h.startsWith("0x")) h = "0x" + h;
  return h;
}

/**
 * 为strk-merkle-tree库格式化（确保偶数长度）
 */
function normalizeHexForLib(h) {
  const normalized = normalizeHex(h);
  return normalized.length % 2 === 0 ? normalized : "0x0" + normalized.slice(2);
}

/**
 * Pedersen多元素哈希（用于domain_hash_finalize）
 */
function pedersenMany(fields) {
  const xs = fields.map((x) => normalizeHex(x));
  return hash.computeHashOnElements(xs);
}

// ===== Merkle Tree 核心函数 =====

/**
 * 计算安全哈希（第一步）- 对应合约的compute_secure_hash
 * 包含所有参数的域分离哈希
 */
function computeSecureHash(pool_id, epoch, index, account, shares, amount) {
  const LEAF_TAG = shortString.encodeShortString("KOL_LEAF");

  // 模拟Cairo的PedersenTrait::new(0).update_with(...).finalize()
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
  state = hash.computePedersenHash(state, "0x7"); // 参数数量

  return normalizeHex(state);
}

/**
 * 计算叶子哈希（第二步）- 对应合约的leaf_hash_pedersen
 * 标准OpenZeppelin格式的叶子哈希
 */
function customLeafHash(leafData) {
  const [account, secureHash] = leafData;
  let state = "0x0";
  state = hash.computePedersenHash(state, account);
  state = hash.computePedersenHash(state, secureHash);
  // 不附加参数个数；与合约 leaf_hash_pedersen 一致：pedersen(0, finalized)
  const finalHash = hash.computePedersenHash("0x0", state);
  return normalizeHex(finalHash);
}

/**
 * 自定义节点哈希函数 - 对应合约的PedersenCHasher
 * 数值排序的可交换哈希
 */
function customNodeHash(left, right) {
  const a = BigInt(left);
  const b = BigInt(right);
  const [lo, hi] = a <= b ? [left, right] : [right, left];
  // 与 OZ PedersenCHasher 等价：computeHashOnElements([lo, hi])（内部会附加长度）
  const result = hash.computeHashOnElements([
    normalizeHex(lo),
    normalizeHex(hi),
  ]);
  return normalizeHexForLib(result);
}

// ===== 主要API函数 =====

/**
 * 构建Merkle Tree
 * @param {Array} users - 用户数据数组 [{account: string, shares: bigint}, ...]
 * @param {Object} pool_id - Pool ID {low: bigint, high: bigint}
 * @param {bigint} epoch - Epoch编号
 * @param {bigint} unit_k - 单位转换率（通常是1e18）
 * @returns {Object} Merkle Tree对象
 */
function buildMerkleTree(
  users,
  pool_id,
  epoch,
  unit_k = 1_000_000_000_000_000_000n
) {
  // 为每个用户计算叶子哈希
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

  // 使用SimpleMerkleTree构建树（禁用叶子排序，保持索引与输入一致）
  const tree = SimpleMerkleTree.of(leafHashes, {
    nodeHash: customNodeHash,
    sortLeaves: false,
  });

  // 附加用户数据用于后续处理
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
 * 计算域哈希（用于签名）- 对应合约的domain_hash_finalize
 * @param {string} contractAddress - 合约地址
 * @param {Object} pool_id - Pool ID {low: bigint, high: bigint}
 * @param {bigint} epoch - Epoch编号
 * @param {string} merkle_root - Merkle根
 * @param {bigint} total_shares - 总shares
 * @param {bigint} unit_k - 单位转换率
 * @param {bigint} deadline_ts - 截止时间戳
 * @param {bigint} nonce - Nonce值
 * @returns {string} 域哈希
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
  fields.push(contractAddress); // 合约地址
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
 * 生成ECDSA签名
 * @param {string} privateKey - Attester私钥
 * @param {string} domainHash - 域哈希
 * @returns {Object} 签名 {r: string, s: string}
 */
function signFinalize(privateKey, domainHash) {
  const signature = ec.starkCurve.sign(domainHash, privateKey);
  return {
    r: normalizeHex(signature.r),
    s: normalizeHex(signature.s),
  };
}

// ===== 主要业务函数 =====

/**
 * 生成完整的Merkle数据（后端主要调用的函数）
 * @param {Object} params - 参数对象
 * @param {Array} params.users - 用户数据 [{account, shares}, ...]
 * @param {string} params.contractAddress - KolEscrow合约地址
 * @param {Object} params.pool_id - Pool ID {low, high}
 * @param {bigint} params.epoch - Epoch编号
 * @param {bigint} params.deadline_ts - 截止时间戳
 * @param {bigint} params.nonce - 当前nonce值
 * @param {string} params.attesterPrivateKey - Attester私钥
 * @param {bigint} params.unit_k - 单位转换率（默认1e18）
 * @returns {Object} 完整的Merkle数据
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
  // 1. 构建Merkle Tree
  const tree = buildMerkleTree(users, pool_id, epoch, unit_k);
  const merkle_root = tree.root;

  // 2. 计算总shares
  const total_shares = users.reduce((sum, user) => sum + user.shares, 0n);

  // 3. 生成域哈希
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

  // 4. 生成签名
  const signature = signFinalize(attesterPrivateKey, domainHash);

  // 5. 为每个用户生成proof
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
    // finalize_epoch调用参数
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
    // 用户proof数据
    user_proofs: userProofs,
    // 调试信息
    debug: {
      domain_hash: domainHash,
      signature,
      total_users: users.length,
      total_shares,
    },
  };
}

// ===== 使用示例 =====

/**
 * 示例：后端如何使用这个模块
 */
function exampleUsage() {
  // Atlas前端4人测试数据 - 总共10000 MKFR
  const users = [
    {
      account:
        "0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930", // main/atlas
      shares: 2500n, // 2500 MKFR (25%)
    },
    {
      account:
        "0x012B099F50C3CbCc82ccF7Ee557c9d60255c35C359eA6615435B761Ec3336EC8", // jimmy
      shares: 2500n, // 2500 MKFR (25%)
    },
    {
      account:
        "0x0299970bA982112ab018832b2875fF750409d5239c1Cc056e98402d8D53Bd148", // leo
      shares: 2500n, // 2500 MKFR (25%)
    },
    {
      account:
        "0x064167f58534A0D29EAb5e6813Cc116E6eC978009920108ee7aA15f0e8Ae7f2D", // 第4个人
      shares: 2500n, // 2500 MKFR (25%)
    },
  ];

  const params = {
    users,
    contractAddress:
      "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a", // 最新KolEscrow地址
    pool_id: { low: 0x2002n, high: 0n }, // Atlas可领取测试池
    epoch: 1n,
    deadline_ts: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24小时后
    nonce: 0n, // 从合约查询当前nonce
    attesterPrivateKey:
      "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f",
    unit_k: 1_000_000_000_000_000_000n, // 1e18
  };

  // 生成Merkle数据
  const merkleData = generateMerkleData(params);

  console.log("=== 后端Merkle数据生成示例 ===");
  console.log("Merkle Root:", merkleData.finalize_params.merkle_root);
  console.log("Domain Hash:", merkleData.debug.domain_hash);
  console.log("Signature R:", merkleData.finalize_params.r);
  console.log("Signature S:", merkleData.finalize_params.s);
  console.log("Total Users:", merkleData.debug.total_users);
  console.log("Total Shares:", merkleData.debug.total_shares.toString());

  // 用户proof示例
  console.log("\n=== 用户Proof数据 ===");
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

// ===== 导出函数 =====

export {
  // 核心API
  generateMerkleData,
  buildMerkleTree,
  computeDomainHash,
  signFinalize,

  // 工具函数
  computeSecureHash,
  customLeafHash,
  customNodeHash,
  normalizeHex,
  normalizeHexForLib,
  pedersenMany,

  // 示例
  exampleUsage,
};

// 如果直接运行此脚本，执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage();
}
