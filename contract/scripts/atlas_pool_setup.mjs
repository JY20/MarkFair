/**
 * =============================================================================
 * ATLAS 前端测试池设置脚本
 * =============================================================================
 *
 * 功能: 为Atlas前端团队创建完整的测试环境
 * 包含: 1个待充值池 + 1个可领取池
 *
 * 池子1: 1000 MKFR 待充值池 (让前端测试充值功能)
 * 池子2: 10000 MKFR 可领取池 (让前端测试领取功能)
 * =============================================================================
 */

import { hash, ec, shortString, CallData, RpcProvider, Account } from "starknet";
import { SimpleMerkleTree } from "@ericnordelo/strk-merkle-tree";

// ===== 配置信息 =====
const CONFIG = {
  // 网络配置
  network: "sepolia",
  rpcUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8",
  
  // 合约地址
  kolEscrowAddress: "0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a",
  mkfrTokenAddress: "0x075d470cb627938cb8f835fd01cab06b7fab0fbe4b2eeb2f6e6175edad0f98ec",
  
  // 测试账户 (从deploy_testnet.md)
  accounts: {
    main: "0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930", // 你的主账户
    atlas: "0x01fF290425e3fB08e3aaC216dfB5Bb41367218040946eDd0f186365326322930", // atlas
    jimmy: "0x012B099F50C3CbCc82ccF7Ee557c9d60255c35C359eA6615435B761Ec3336EC8", // jimmy  
    leo: "0x0299970bA982112ab018832b2875fF750409d5239c1Cc056e98402d8D53Bd148"   // leo
  },
  
  // Attester密钥
  attesterPK: "0x57f16e241689e66d3a7c9b35d4f09d7bb492d062a0fa2166a7a4b366b777fe1",
  attesterSK: "0x04d8fa5f31cd5642f6c5be28d9f7414b4055d85e8050d3e996f34f6a8b950a0f",
  
  // 池子配置
  pools: {
    funding: {
      id: 0x2001,
      name: "Atlas_Funding_Test",
      amount: "1000000000000000000000", // 1000 MKFR
      status: "待充值"
    },
    claimable: {
      id: 0x2002, 
      name: "Atlas_Claimable_Test",
      amount: "10000000000000000000000", // 10000 MKFR
      status: "可领取"
    }
  }
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
  const leaves = userData.map(({ user, shares }) => customLeafHash(user, shares));
  return new SimpleMerkleTree(leaves, customNodeHash);
}

function computeDomainHash(poolId, epoch) {
  const poolIdHex = normalizeHexForLib(poolId);
  const epochHex = normalizeHexForLib(epoch);
  return hash.pedersen([poolIdHex, epochHex]);
}

function signFinalize(poolId, epoch, merkleRoot, privateKey) {
  const domainHash = computeDomainHash(poolId, epoch);
  const messageHash = hash.pedersen([domainHash, normalizeHexForLib(merkleRoot)]);
  const keyPair = ec.starkCurve.getStarkKey(privateKey);
  const signature = ec.starkCurve.sign(messageHash, privateKey);
  return [signature.r.toString(), signature.s.toString()];
}

// ===== 主要功能函数 =====

async function setupClaimablePool() {
  console.log("\n🎯 设置可领取池子 (Pool 0x2002)...");
  
  // 4人测试数据 - 总共10000 MKFR
  const userData = [
    { user: CONFIG.accounts.main, shares: "2500000000000000000000" },  // 2500 MKFR (25%)
    { user: CONFIG.accounts.atlas, shares: "2500000000000000000000" }, // 2500 MKFR (25%) 
    { user: CONFIG.accounts.jimmy, shares: "2500000000000000000000" }, // 2500 MKFR (25%)
    { user: CONFIG.accounts.leo, shares: "2500000000000000000000" }    // 2500 MKFR (25%)
  ];
  
  console.log("📊 用户分配:");
  userData.forEach(({user, shares}, i) => {
    const name = Object.keys(CONFIG.accounts)[i];
    const amount = (BigInt(shares) / BigInt("1000000000000000000")).toString();
    console.log(`  ${name}: ${amount} MKFR (${user})`);
  });
  
  // 生成Merkle树
  const merkleTree = buildMerkleTree(userData);
  const merkleRoot = merkleTree.root;
  
  console.log(`🌳 Merkle Root: ${merkleRoot}`);
  
  // 生成签名
  const poolId = CONFIG.pools.claimable.id;
  const epoch = 1;
  const [r, s] = signFinalize(poolId, epoch, merkleRoot, CONFIG.attesterSK);
  
  console.log(`✍️  签名: r=${r}, s=${s}`);
  
  // 生成每个用户的proof
  console.log("\n🔐 用户Proof数据:");
  const proofs = {};
  userData.forEach(({user, shares}, index) => {
    const leaf = customLeafHash(user, shares);
    const proof = merkleTree.getProof(leaf);
    const name = Object.keys(CONFIG.accounts)[index];
    
    proofs[name] = {
      user,
      shares,
      proof: proof.map(p => normalizeHex(p))
    };
    
    console.log(`  ${name}:`);
    console.log(`    地址: ${user}`);
    console.log(`    份额: ${shares} (${(BigInt(shares) / BigInt("1000000000000000000")).toString()} MKFR)`);
    console.log(`    Proof: [${proof.map(p => `"${normalizeHex(p)}"`).join(", ")}]`);
  });
  
  return {
    poolId,
    epoch,
    merkleRoot,
    signature: { r, s },
    userData,
    proofs
  };
}

// ===== 输出测试信息 =====

async function generateTestInfo() {
  console.log("🏊‍♂️ Atlas前端测试池配置");
  console.log("=" .repeat(50));
  
  // 池子1信息
  console.log("\n✅ 池子1: 待充值测试池");
  console.log(`Pool ID: 0x${CONFIG.pools.funding.id.toString(16)}`);
  console.log(`名称: ${CONFIG.pools.funding.name}`);
  console.log(`代币: MKFR (${CONFIG.mkfrTokenAddress})`);
  console.log(`目标金额: 1000 MKFR`);
  console.log(`状态: 🟡 待充值 (Atlas可以测试充值功能)`);
  console.log(`创建交易: 0x0084deeda776ffc340cc8ac9ce2e977786114947ab0ebca575962f2acff14cc6`);
  
  // 池子2信息和Merkle数据
  const claimableData = await setupClaimablePool();
  
  console.log("\n✅ 池子2: 可领取测试池");
  console.log(`Pool ID: 0x${CONFIG.pools.claimable.id.toString(16)}`);
  console.log(`名称: ${CONFIG.pools.claimable.name}`);
  console.log(`代币: MKFR (${CONFIG.mkfrTokenAddress})`);
  console.log(`总金额: 10000 MKFR`);
  console.log(`状态: 🟢 可领取 (Atlas可以测试领取功能)`);
  console.log(`创建交易: 0x063683a2643346c99eaf51020b20c093cef1e808639a414f7b824f03b1f117c4`);
  
  // finalize_epoch命令
  console.log("\n🔧 Finalize Epoch 命令:");
  console.log(`sncast invoke --network sepolia \\`);
  console.log(`  --contract-address ${CONFIG.kolEscrowAddress} \\`);
  console.log(`  --function finalize_epoch \\`);
  console.log(`  --calldata ${claimableData.poolId} 0 ${claimableData.epoch} ${claimableData.merkleRoot} ${claimableData.signature.r} ${claimableData.signature.s}`);
  
  // 前端API数据
  console.log("\n📱 前端测试数据:");
  console.log("```json");
  console.log(JSON.stringify({
    pools: {
      funding: {
        id: "0x" + CONFIG.pools.funding.id.toString(16),
        name: CONFIG.pools.funding.name,
        token: CONFIG.mkfrTokenAddress,
        targetAmount: "1000000000000000000000",
        status: "funding",
        deadline: Math.floor(Date.now() / 1000) + 1209600, // 14天后
        refundAfter: Math.floor(Date.now() / 1000) + 1814400 // 21天后
      },
      claimable: {
        id: "0x" + CONFIG.pools.claimable.id.toString(16), 
        name: CONFIG.pools.claimable.name,
        token: CONFIG.mkfrTokenAddress,
        totalAmount: "10000000000000000000000",
        status: "claimable",
        epoch: claimableData.epoch,
        merkleRoot: claimableData.merkleRoot,
        users: claimableData.proofs
      }
    },
    contracts: {
      kolEscrow: CONFIG.kolEscrowAddress,
      mkfrToken: CONFIG.mkfrTokenAddress
    }
  }, null, 2));
  console.log("```");
  
  console.log("\n🎯 测试场景:");
  console.log("1. 充值测试: 使用Pool 0x2001，Atlas可以测试approve + fund_pool_with_transfer");
  console.log("2. 领取测试: 使用Pool 0x2002，4个用户都可以测试claim_epoch");
  console.log("3. 预览测试: 使用preview_amount函数测试金额计算");
  console.log("4. 状态查询: 测试get_pool_info等查询函数");
  
  console.log("\n✨ 准备完成！Atlas前端可以开始测试了！");
}

// 运行
generateTestInfo().catch(console.error);
