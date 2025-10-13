/**
 * =============================================================================
 * ATLAS 完整测试池设置脚本 (PTB版本)
 * =============================================================================
 *
 * 功能: 一次性完成Atlas测试池的完整设置
 * 包含: 授权 → 充值 → Finalize → 生成Proof数据
 *
 * 优势: 使用单个交易批次，避免授权问题
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

// ===== 配置信息 =====
const CONFIG = {
  // 网络配置
  rpcUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8",

  // 合约地址
  kolEscrowAddress:
    "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a",
  mkfrTokenAddress:
    "0x075d470cb627938cb8f835fd01cab06b7fab0fbe4b2eeb2f6e6175edad0f98ec",

  // Atlas前端4人测试数据
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

  // Attester密钥
  attesterSK:
    "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f",

  // 池子配置
  poolId: 0x2002,
  epoch: 1,
  totalAmount: "10000000000000000000000", // 10000 MKFR
};

// ===== 工具函数 =====

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

// Merkle树相关函数
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

// ===== 主要功能 =====

async function generateCompleteSetup() {
  console.log("🏊‍♂️ Atlas前端完整测试池设置");
  console.log("=".repeat(50));

  // 生成Merkle树
  console.log("\n🌳 生成Merkle树...");
  const merkleTree = buildMerkleTree(CONFIG.users);
  const merkleRoot = merkleTree.root;

  console.log(`Merkle Root: ${merkleRoot}`);

  // 生成签名
  console.log("\n✍️  生成finalize签名...");
  const [r, s] = signFinalize(
    CONFIG.poolId,
    CONFIG.epoch,
    merkleRoot,
    CONFIG.attesterSK
  );

  console.log(`签名 R: ${r}`);
  console.log(`签名 S: ${s}`);

  // 生成用户proof数据
  console.log("\n🔐 生成用户Proof数据...");
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
    console.log(`    地址: ${account}`);
    console.log(
      `    份额: ${shares} (${(
        BigInt(shares) / BigInt("1000000000000000000")
      ).toString()} MKFR)`
    );
    console.log(
      `    Proof: [${proof.map((p) => `"${normalizeHex(p)}"`).join(", ")}]`
    );
  });

  // 输出完整的命令序列
  console.log("\n🔧 完整设置命令序列:");
  console.log("=".repeat(50));

  console.log("\n1️⃣ 授权代币:");
  console.log(`sncast invoke --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.mkfrTokenAddress} \\`);
  console.log(`  --function approve \\`);
  console.log(
    `  --calldata ${CONFIG.kolEscrowAddress} 0x21e19e0c9bab2400000 0x0`
  );

  console.log("\n2️⃣ 充值池子:");
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

  // 输出测试命令
  console.log("\n🧪 测试命令:");
  console.log("=".repeat(50));

  console.log("\n📊 查询池子状态:");
  console.log(`sncast call --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function get_pool_info \\`);
  console.log(`  --calldata 0x${CONFIG.poolId.toString(16)} 0x0`);

  console.log("\n💰 预览奖励金额 (以jimmy为例):");
  console.log(`sncast call --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function preview_amount \\`);
  console.log(
    `  --calldata 0x${CONFIG.poolId.toString(16)} 0x0 ${
      CONFIG.epoch
    } 0x21e19e0c9bab2400000 0x0`
  );

  console.log("\n🎁 领取奖励 (以jimmy为例):");
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

  // 输出前端JSON数据
  console.log("\n📱 前端测试数据:");
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
            description: "可领取测试池 - 4个用户都可以测试领取功能",
          },
        },
        contracts: {
          kolEscrow: CONFIG.kolEscrowAddress,
          mkfrToken: CONFIG.mkfrTokenAddress,
        },
        testScenarios: [
          "充值测试: Pool 0x2001 - approve + fund_pool_with_transfer",
          "领取测试: Pool 0x2002 - claim_epoch (4个用户)",
          "预览测试: preview_amount函数测试",
          "状态查询: get_pool_info等查询函数",
        ],
      },
      null,
      2
    )
  );
  console.log("```");

  console.log("\n✨ 设置完成！Atlas前端可以开始测试了！");
  console.log("\n🎯 测试步骤:");
  console.log("1. 运行上面的3个命令完成池子设置");
  console.log("2. 使用JSON数据配置前端");
  console.log("3. 测试充值功能 (Pool 0x2001)");
  console.log("4. 测试领取功能 (Pool 0x2002, 4个用户)");

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
