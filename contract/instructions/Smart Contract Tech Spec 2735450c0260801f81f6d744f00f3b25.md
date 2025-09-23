# Smart Contract Tech Spec

创建者: Chen Mark
创建时间: 2025 年 9 月 19 日 15:22
上次编辑者: Chen Mark
上次更新时间: 2025 年 9 月 21 日 22:19

## Overview

本规范定义一个在 **Starknet**（Cairo 1）上实现的 **KOL 激励托管（Escrow）结算合约**。系统目标：

- 品牌方先把预算资金注入**资金池（Pool）**；
- 活动结束后，后端离线计算每个创作者应得份额，构建 **Merkle 根**；
- 创作者使用 `(address, amount, proof)` **按比例领取**；
- 允许品牌在**领取期结束**后退回未领取余额。

MVP 不实现隐私/动态释放，**只支持最终清算**；合约可信最小化（只存根、做校验、转账），公平性由链下计算+双签保证。

---

## Design Goals

- **Gas/存储友好**：仅保存 Merkle 根与最少状态；O(log N) 证明。
- **顺序无关**：每人可独立领取，先后不影响金额。
- **可审计**：事件完备 & 不变量明确。
- **抗重放**：域隔离 + nonce + deadline。
- **安全回退**：超时后品牌可退款；可全局暂停（Pausable）。

---

## Entities & Roles

- **Owner（平台合约管理员）**：部署者；可设置参数、暂停、升级（若采用代理）。
- **Brand（品牌）**：活动发起者与资金所有者；对 finalize 消息签名。
- **Attestor（平台签名者）**：后端 KMS/HSM 管理的公钥；对 finalize 消息签名。
- **Creator（创作者）**：在 Starknet 上的收款地址。
- **Token**：ERC20（Cairo 1 接口）地址（如 USDC/STRK 等 L2 代币）。

---

## States & Lifecycle

1. **创建（create_pool）** → 返回 `pool_id`，记录品牌、代币、领取期限等元数据；
2. **充值（fund_pool）** → 品牌 `approve` 后调用，本合约 `transfer_from` 收款，累计 `funded_amount`；
3. **结算锁定（finalize_with_sig）** → 上链 `merkle_root`、`total_shares`、`unit_k = floor(funded/total_shares)`；切换为 `Finalized`；
4. **领取（claim）** → 创作者提交 `(index, account, shares_i, proof)`，校验通过后转账 `amount_i = unit_k * shares_i`；
5. **退款（refund_remaining）** → 到达 `refund_after_ts` 或到达 `deadline` + grace，品牌取回剩余；
6. **关闭（close_pool）**（可选）→ 所有款项已发完或退款后，标记关闭。

---

## Storage Layout

```rust
// SPDX-License-Identifier: MIT
// Cairo 1 pseudo-structs (illustrative)

#[derive(Drop, Serde)]
struct PoolInfo {
    brand: ContractAddress,          // 品牌地址（Starknet Account）
    token: ContractAddress,          // ERC20 代币地址
    status: u8,                      // 0=Created,1=Funded,2=Finalized,3=Closed
    funded_amount: u256,             // 已充值总额
    allocated_shares: u256,          // finalize 冻结的 total_shares
    unit_k: u256,                    // floor(funded_amount / total_shares)
    merkle_root: felt252,            // Poseidon(root)
    brand_pubkey: felt252,           // 验证品牌签名（如基于 account class 要求可省略）
    attestor_pubkey: felt252,        // 平台签名公钥
    deadline_ts: u64,                // 领取截止时间戳（秒）
    refund_after_ts: u64,            // 允许退款的最早时间（秒）
    chain_id: felt252,               // 链ID缓存用于域隔离
    domain_separator: felt252,
    // hash("KOL/ESCROW", contract_addr, chain_id)
    // 领取防重入/防重复: 方案A 按 index 位图；方案B 按地址映射
    // MVP 采用位图（更省存储），index 由 off-chain 固化
    claimed_bitmap_words: LegacyMap<u256, u256>, // word_index -> 256-bit word
    total_claimed_amount: u256,      // 累计已领取总额（用于退款计算）
}

#[storage]
struct Storage {
    owner: ContractAddress,          // 合约管理员
    paused: bool,
    pool_counter: u256,
    pools: LegacyMap<u256, PoolInfo>,      // pool_id -> PoolInfo
}

```

> 注：claimed_bitmap_words 位图：第 index 位标记是否领取。word = index / 256；bit = index % 256。
>
> 如需“按地址去重”，改为 `LegacyMap<ContractAddress, bool>`。

---

## Events

```rust
#[event]
struct PoolCreated { pool_id: u256, brand: ContractAddress, token: ContractAddress }

#[event]
struct PoolFunded { pool_id: u256, amount: u256, funded_total: u256 }

#[event]
struct PoolFinalized {
    pool_id: u256,
    merkle_root: felt252,
    total_shares: u256,
    unit_k: u256,
    deadline_ts: u64
}

#[event]
struct Claimed { pool_id: u256, index: u256, account: ContractAddress, shares: u256, amount: u256 }

#[event]
struct Refund { pool_id: u256, to: ContractAddress, amount: u256 }

#[event]
struct Paused { by: ContractAddress, flag: bool }

```

---

## Error Codes

```rust
const E_UNAUTHORIZED: u32        = 1;
const E_PAUSED: u32              = 2;
const E_POOL_NOT_FOUND: u32      = 3;
const E_BAD_STATUS: u32          = 4;
const E_TOKEN_TRANSFER_FAIL: u32 = 5;
const E_INVALID_PARAM: u32       = 6;
const E_SIG_VERIFY_FAILED: u32   = 7;
const E_DEADLINE_PASSED: u32     = 8;
const E_NOT_REACHED: u32         = 9;
const E_ALREADY_CLAIMED: u32     = 10;
const E_PROOF_INVALID: u32       = 11;
const E_OVER_ALLOCATED: u32      = 12;
const E_NO_BALANCE: u32          = 13;

```

---

## Hashing & Signatures

- **Merkle**：建议 **Poseidon** 哈希；叶编码固定：
  `leaf = Poseidon(pool_id, index, account, shares)`（定长定序，防拼接歧义；`shares` 为 u256）。
- **Finalize 双签**：

  - 消息：

    ```
    msg = Poseidon(
      domain_separator,
      pool_id,
      merkle_root,
      total_shares,
      deadline_ts
    )

    ```

  - **brand_sig**：由 `pools[pool_id].brand_pubkey` 验证；
  - **attestor_sig**：由 `pools[pool_id].attestor_pubkey` 验证；
  - 合约还校验 `block_timestamp <= deadline_ts`（防过期签名）。

> domain_separator = Poseidon("KOL/ESCROW", contract_address, chain_id)
>
> `chain_id` 可通过 `get_execution_info().chain_id` 初始化。

---

## External Functions

### Admin

```rust
fn set_paused(flag: bool) onlyOwner
fn set_owner(new_owner: ContractAddress) onlyOwner

```

### Pool Management

```rust
/// 创建池：只登记元数据，资金与分配分离
fn create_pool(
    token: ContractAddress,
    brand: ContractAddress,
    attestor_pubkey: felt252,
    brand_pubkey: felt252,
    deadline_ts: u64,
    refund_after_ts: u64
) -> u256  // returns pool_id
  REQUIRES: !paused, now < deadline_ts, refund_after_ts >= deadline_ts
  EFFECTS:  pool_counter += 1; pools[pool_id] = PoolInfo{... status=Created }
  EMITS:    PoolCreated

```

```rust
/// 充值：品牌先对本合约 approve，再调用本函数从品牌转入
fn fund_pool(pool_id: u256, amount: u256)
  REQUIRES: !paused, pool.status in {Created, Funded}, amount>0
            msg.sender == pools[pool_id].brand
  EFFECTS:  ERC20(token).transfer_from(brand, this, amount)
            pools[pool_id].funded_amount += amount
            if status == Created => status = Funded
  EMITS:    PoolFunded

```

```rust
/// 双签 finalize：冻结分母与单价，写入 merkle_root
fn finalize_with_sig(
    pool_id: u256,
    merkle_root: felt252,
    total_shares: u256,
    deadline_ts: u64,
    brand_sig: (felt252,felt252),     // (r,s) or Cairo-friendly tuple
    attestor_sig: (felt252,felt252)
)
  REQUIRES: !paused, pool.status == Funded, total_shares>0, now <= deadline_ts
            verify_sig(brand_pubkey, msg, brand_sig)
            verify_sig(attestor_pubkey, msg, attestor_sig)
  LET:      funded = pools[pool_id].funded_amount
            unit_k = floor_div(funded, total_shares)
  EFFECTS:  pools[pool_id].merkle_root = merkle_root
            pools[pool_id].allocated_shares = total_shares
            pools[pool_id].unit_k = unit_k
            pools[pool_id].deadline_ts = deadline_ts
            pools[pool_id].status = Finalized
  EMITS:    PoolFinalized

```

### Claim & Refund

```rust
/// 领取：按 shares_i * unit_k 计算金额，验证 Merkle 证明与未领位
fn claim(
    pool_id: u256,
    index: u256,
    account: ContractAddress,
    shares: u256,
    proof: Array<felt252>   // poseidon siblings
)
  REQUIRES: !paused, pool.status == Finalized, now <= pools[pool_id].deadline_ts
            bit_not_set(claimed_bitmap_words, index)
            verify_merkle(proof, Poseidon(pool_id,index,account,shares), merkle_root)
  LET:      amount = mul_u256(pools[pool_id].unit_k, shares)   // safe mul
  EFFECTS:  set_bit(claimed_bitmap_words, index)
            ERC20(token).transfer(account, amount)
            pools[pool_id].total_claimed_amount += amount
  EMITS:    Claimed

```

```rust
/// 退款：活动结束且过退款时间，将剩余资金退回品牌
fn refund_remaining(pool_id: u256, to: ContractAddress)
  REQUIRES: !paused, pool.status == Finalized, now >= pools[pool_id].refund_after_ts
            msg.sender == pools[pool_id].brand
  LET:      remaining = funded_amount - total_claimed_amount
  REQUIRES: remaining > 0
  EFFECTS:  ERC20(token).transfer(to, remaining)
            pools[pool_id].status = Closed   // 可选：若希望彻底结束
  EMITS:    Refund

```

---

## Views / Getters

```rust
fn get_pool_info(pool_id: u256) -> PoolInfoView   // 精简版视图，去除大映射

fn is_claimed(pool_id: u256, index: u256) -> bool

fn preview_amount(pool_id: u256, shares: u256) -> u256
  RETURNS: unit_k * shares

```

---

## Invariants & Accounting

- `unit_k = floor(funded_amount / total_shares)` 在 finalize 时确定；
- 对于任一 `claim`：`amount_i = unit_k * shares_i`；
- 累计领取不变量：`total_claimed_amount <= funded_amount`；
- 退款时：`remaining = funded_amount - total_claimed_amount`；
- **永不超发**：通过取整与不变量保证。

---

## Merkle Verifier (Poseidon)

- 叶：`leaf = Poseidon(pool_id, index, account, shares)`。
- 路径方向约定（左/右）由 off-chain 固化；on-chain 假设 proof 顺序和方向与构树一致（常用“带方向位”的 siblings；MVP 可采用 **排序拼接**策略：`hash(min(a,b), max(a,b))` 简化方向处理，但需与 off-chain 一致）。
- 验证伪代码：

```rust
fn verify_merkle(proof[], leaf, root) -> bool {
    mut h = leaf;
    for s in proof {
        h = poseidon2(h, s); // 或 poseidon2(min(h,s), max(h,s))
    }
    return h == root;
}

```

---

## Security Considerations

1. **签名域隔离**：`domain_separator` 包含 `chain_id` 与 `contract_address`，杜绝跨链/跨合约重放。
2. **双签**：Brand + Attestor 缩短单点作弊路径；`deadline_ts` 限定时效。
3. **领取防重复**：位图 O(1) 设置位；拒绝重复领取。
4. **Pausable**：紧急情况下暂停 `fund/finalize/claim/refund`。
5. **Token 接口安全**：检查 `transfer/transfer_from` 返回值或采用 SafeERC20 约定；防止异常代币行为。
6. **整数安全**：所有金额、shares 统一用 `u256`；`unit_k * shares` 做上溢检查。
7. **DoS 防护**：不存全名单；验证 O(log N)；外部调用尽量尾部（Checks-Effects-Interactions）。
8. **索引唯一性**：`index` 必须由 off-chain 固化（如按地址排序赋值），不可被用户更换。
9. **退款策略**：清晰的 `refund_after_ts`；前端告知创作者领取期限。
10. **可升级（可选）**：若采用代理，限制 `upgradeTo` 给 owner；迁移保留存储布局。

---

## Integration Contract Interfaces

**ERC20（Cairo 1 简化接口）**：

```rust
trait IERC20 {
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(account: ContractAddress) -> u256;
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256;
    fn approve(spender: ContractAddress, amount: u256) -> bool;
}

```

---

## Off-chain Responsibilities (FastAPI)

- KPI 抓取、反作弊、最终 `shares_i` 计算；
- 构建 `[(index, account, shares_i)]` & Merkle；
- 形成 `msg(pool_id, root, total_shares, deadline)`，分别收集 **brand_sig** 与 **attestor_sig**；
- 由平台账户发起 `finalize_with_sig` 交易；
- 为创作者提供 `index, shares_i, proof[]`（REST）；
- 监听 `Claimed/Refund` 同步数据库状态。

---

## Example Messages

- **Finalize Message**（off-chain 构造）：

```
domain_separator = Poseidon("KOL/ESCROW", contract_address, chain_id)
msg = Poseidon(domain_separator, pool_id, merkle_root, total_shares, deadline_ts)
brand_sig = Sign(brand_sk, msg)
attestor_sig = Sign(attestor_sk, msg)

```

- **Claim Inputs**：

```
index = 固化的序号（u256）
account = 创作者收款地址
shares = u256
proof = [sibling_0, sibling_1, ..., sibling_h]

```

---

## Minimal ABI (Calldata)

```
create_pool(token, brand, attestor_pubkey, brand_pubkey, deadline_ts, refund_after_ts) -> pool_id

fund_pool(pool_id, amount)

finalize_with_sig(pool_id, merkle_root, total_shares, deadline_ts, brand_sig_r, brand_sig_s, attestor_sig_r, attestor_sig_s)

claim(pool_id, index, account, shares, proof_len, proof[0..n])

refund_remaining(pool_id, to)

```

---

## Testing Checklist

- **Finalize**：签名错误、过期、total_shares=0、funded=0；
- **Claim**：正确 proof、错误 proof、重复领取、超期领取、amount 上溢/零额；
- **Refund**：未到期/到期、全部已领/部分未领；
- **Pause**：所有外部函数在 pause 下拒绝；
- **ERC20 异常**：transfer/transfer_from 返回 false；
- **Bitmap**：高 index、跨 word、并发领取。

---

## Implementation Timeline (MVP)

- **Day 1**：存储/事件/基础函数框架（create/fund/pause/view）
- **Day 2**：Merkle 验证器（Poseidon）、claim 位图、退款；
- **Day 3**：双签 finalize + 签名验证 & 不变量校验；
- **Day 4-5**：单元测试、Fuzz（proof/bitmap/金额边界）、本地网模拟；
- **Day 6**：Testnet 部署、端到端联调（FastAPI/React）；
- **Day 7**：文档与监控（事件订阅、Dashboards）。

---

## Appendix: Gas & Sizing Hints

- finalize：O(1)（存根）；
- claim：O(log N)（proof 深度 ~ `ceil(log2 N)`）；
- 位图写入：O(1)；
- proof 大小：~32–48 字（取决于 N 和哈希），对 Cairo 1 可接受；
- `unit_k` 预取整，避免超发；尘埃在 `refund_remaining` 统一处理。

---

**结论**：该合约以 **“托管资金 + Merkle 根 + 双签 finalize + O(log N) 领取 + 到期退款”** 为核心，满足你对 **最终清算、顺序无关、公平按份额发放** 的 MVP 诉求，链上最小逻辑、链下可扩展计算，实施难度低、审计面小、上线快。

## Update (Aligned with repo code – ready for FE/BE integration)

### 0. Addresses & Artifacts (Devnet)

- RPC: `http://127.0.0.1:5050`
- KolEscrow: `0x02902f77f57a067062446751e1d1b0b2600cacdf3b54e73377fd57fb037c7b5e`
- MARK (ERC20): `0x051f71350f42f28d151e57633b38abbda5e7a946fe087eab51e653545d1e7569`
- ABI: `contract/target/dev/contract.starknet_artifacts.json`

### 1. Storage & State (final)

- PoolInfo: brand, token, status, funded_amount, total_claimed_amount, current_epoch, allocated_shares, unit_k, merkle_root, deadline_ts, refund_after_ts
- EpochMeta: merkle_root, total_shares, unit_k, deadline_ts, refund_after_ts, claimed_amount, status
- Maps:
  - pools: `Map<u256, PoolInfo>`
  - epoch_meta: `Map<(u256, u64), EpochMeta>`
  - claimed_epoch: `Map<(u256, u64, u256), bool>`
  - finalize_nonce_v1: `Map<u256, u64>`
  - finalize_nonce_v2: `Map<(u256, u64), u64>`
- Global: owner, paused, reentrancy_guard

### 2. ABI (extern/view) – 参数均为 Cairo 语义

- Admin
  - `pause(flag: bool)` onlyOwner
- Pool
  - `create_pool(pool_id:u256, brand:address, token:address, attester_pubkey:felt, deadline_ts:u64, refund_after_ts:u64)`
  - `fund_pool(pool_id:u256, amount:u256)`
  - `finalize_pool(pool_id:u256, merkle_root:felt, total_shares:u256, unit_k:u256, deadline_ts:u64, msg_hash:felt, sig_r:felt, sig_s:felt)`
  - `claim(pool_id:u256, index:u256, account:address, shares:u256, amount:u256, proof:felt[])`
  - `refund_and_close(pool_id:u256, to:address)`
  - Getters: `get_pool`, `preview_amount(pool_id, shares)`, `get_pool_status/get_pool_funded/get_pool_brand/get_pool_token`
- ERC20 集成
  - `fund_pool_with_transfer(pool_id:u256, token:address, from:address, amount:u256)`
  - `claim_with_transfer(pool_id:u256, index:u256, account:address, shares:u256, amount:u256, proof:felt[])`（内部路由 epoch=0）
  - `refund_and_close_with_transfer(pool_id:u256, to:address)`
- Epoch
  - `finalize_epoch(pool_id:u256, epoch:u64, merkle_root:felt, total_shares:u256, unit_k:u256, deadline_ts:u64, msg_hash:felt, r:felt, s:felt)`
  - `claim_epoch_with_transfer(pool_id:u256, epoch:u64, index:u256, account:address, shares:u256, amount:u256, proof:felt[])`
  - `refund_and_close_epoch(pool_id:u256, epoch:u64, to:address)`

说明：

- u256 以 `[low, high]` 传参；address 用 `ContractAddress` felt 表示。
- `claim_with_transfer` 与 `claim_epoch_with_transfer` 均需合约已持有足额 token。

### 3. 事件 (统一)

- PoolCreated, PoolFunded(delta,total), PoolFinalized
- FundsIn(from, token, amount), FundsOut(to, token, amount)
- Claimed(index, account, shares, amount)
- EpochFinalized(pool_id, epoch, ...)
- ClaimedEpoch(pool_id, epoch, index, account, shares, amount)
- Refund, RefundEpoch

### 4. 错误码（短字符串 felt）

- `PAUSED/NOT_OWNER/NO_POOL/POOL_EXISTS/BAD_STATUS/ALREADY/DEADLINE/NOT_YET/OVERFLOW/UNDERFLOW/BAD_TOKEN/BAD_BRAND/BAD_REFUND_TIME/BAD_UNIT/BAD_SHARES/REENTRANT/TFRM_FAIL/TFROUT_FAIL/BAD_SIG/BAD_PROOF/BAD_AMOUNT`

### 5. Merkle（OZ pedersen）与叶子序列化

- 库：`openzeppelin_merkle_tree::merkle_proof::verify_pedersen`
- 叶：`LEAF_TAG='KOL_LEAF_V1'`
- 序列化顺序（felt 数组，len 前缀 pedersen_hash_many）：
  - `[LEAF_TAG, contract_address, pool_id.low, pool_id.high, epoch_id, index.low, index.high, account, shares.low, shares.high, amount.low, amount.high]`
- 前端/后端构树：内部节点使用排序配对 + Pedersen（commutative）

### 6. 域哈希与签名（Stark 曲线 ECDSA）

- 域哈希：`domain_hash_finalize_v2(pool_id, epoch, merkle_root, total_shares, unit_k, deadline_ts, nonce)`
- nonce：`finalize_nonce_v1[pool_id]` 或 `finalize_nonce_v2[(pool_id,epoch)]`
- 校验：
  - 合约内计算 expected；要求 `msg_hash==expected`
  - `assert(ecdsa_verify(expected, attester_pubkey, r, s))`
  - `r/s != 0` 基本断言

### 7. 金额计算与一致性

- 领取金额：`amount = shares * unit_k`
- 约束：当前实现限制 `shares.high==0` 与 `unit_k.high==0`，并使用 64x64→128 精确乘法；`preview_amount` 与领取、退款一致。
- 记账顺序：先写 `claimed_epoch/claimed_amount/total_claimed_amount`，再转账；所有转账在重入保护下。

### 8. FE/BE 快速集成

- 读：`get_pool_status/funded/brand/token`、`get_pool(pool_id)`（Option）
- 写：
  - 资金：`approve(token, escrow, amount)` → `fund_pool_with_transfer(pool_id, token, brand, amount)`
  - finalize(pool)：计算 expected + 签名后调用 `finalize_pool`
  - finalize(epoch)：同上，包含 `epoch`
  - claim(epoch)：构造 leaf 与 proof 调用 `claim_epoch_with_transfer`
- 参数打包
  - u256 => `[low, high]`
  - proof => `felt[]`
- 事件订阅：监听 `FundsIn/FundsOut/PoolFinalized/EpochFinalized/ClaimedEpoch/RefundEpoch`

### 9. Devnet 命令（示例）

- 导入账户：`sncast account import --address=<devnet_account> --type=oz --url=http://127.0.0.1:5050 --private-key=<pk> --add-profile=devnet`
- 声明/部署：`sncast --profile=devnet declare --contract-name=KolEscrow` → `sncast --profile=devnet deploy --class-hash=<hash> --salt=0`
- 代币：`MarkToken` 已部署；`approve` → `fund_pool_with_transfer` → `get_pool_funded`

### 10. 约束与后续

- 精确乘法将升级为通用 u256 乘法库（移除高位限制）
- 测试将补充：失败路径、nonce 重放、ERC20 异常分支

以上条目与 `contract/src/lib.cairo` 一致，可直接用于 FE/BE 联调。
