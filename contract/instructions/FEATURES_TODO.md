# MarkFair KolEscrow 合约待实现特性清单

本清单汇总当前 `contract/src/lib.cairo` 的待实现/待完善项，按优先级分层，并给出实现要点与验收标准，作为后续迭代的执行指南。

状态标签说明：

- [DONE] 已完成（生产可用）
- [IN_PROGRESS] 进行中（功能可用但仍在迭代）
- [PENDING] 待实现
- [NON-PROD] 非生产实现（临时/简化版，需替换或加固）

更新记录：

- [DONE] 权限与治理（owner/onlyOwner + constructor）
- [DONE] 参数/时间校验
- [IN_PROGRESS][NON-PROD] preview_amount（简化 u256 乘法）
- [IN_PROGRESS] ERC20 资金流（with_transfer 版本）
- [DONE] 重入保护（简易 guard）
- [DONE] Merkle 校验（已切换为 OpenZeppelin pedersen + verify_pedersen，移除 Keccak 简化版）
- [DONE][NON-PROD] 签名域隔离（only 域哈希比对；未接入 ECDSA 验签）
- [DONE] epoch 接口（finalize_epoch / claim_epoch_with_transfer / refund_and_close_epoch）与事件统一化（EpochFinalized/ClaimedEpoch/RefundEpoch）
- [DONE] 构建无警告（移除未使用导入）

## 1. 必做（上线前）

- 权限与治理（Owner/多签） [DONE]

- 资金流闭环（ERC20 托管） [IN_PROGRESS]

  - 已新增：`fund_pool_with_transfer`、`claim_with_transfer`、`refund_and_close_with_transfer` 使用 `IERC20Dispatcher`。[IN_PROGRESS]
  - 待办：与 epoch 的转账路径统一（claim_epoch/退款按 epoch 走），失败路径测试。[PENDING]

- Merkle 校验与签名域隔离 [部分完成]

  - Merkle：使用 `openzeppelin_merkle_tree::merkle_proof::verify_pedersen`，叶子序列化含域标签与 epoch。[DONE]
  - 域隔离：`domain_hash_finalize(...)` 校验 `msg_hash`。[DONE][NON-PROD]
  - 待办：接入 ECDSA 验签库与签名者管理（撤销/轮换）。[PENDING]

- 参数与时间校验 [DONE]

- 状态机与重入保护 [DONE]

## 2. 增强（体验与性能）

- preview_amount 实现 [IN_PROGRESS][NON-PROD]

  - 待办：引入完整 u256 乘法库与溢出处理，覆盖边界测试。[PENDING]

- 事件与错误码规范 [IN_PROGRESS]

  - 要点：统一错误码常量；规范事件字段命名；`FundsIn/FundsOut` 及 epoch 事件已统一。[DONE]
  - 待办：事件/错误码文档化并与前端约定解析规范。[PENDING]

- 存储与存在性表达 [PENDING]

- 批量接口（可选） [PENDING]

## 3. 测试与文档

- 测试覆盖 [PENDING]

  - 要点：
    - 失败路径：重复 claim、提前/过期、状态非法、授权缺失、余额不足；
    - 大数边界与溢出；
    - ERC20 模拟（成功/失败分支）；Merkle 证明正确/错误用例；域哈希不一致用例；epoch 场景。

- 文档 [PENDING]
  - 要点：
    - ABI/事件/错误码说明；
    - 状态机图与时序图；
    - 叶子序列化（域标签 + 合约地址 + pool_id.low/high + epoch + index.low/high + account + shares.low/high + amount.low/high），与前端构树对齐说明；
    - 非生产实现（[NON-PROD]）替换计划与风控说明。

---

## 里程碑计划（建议）

- M1（安全闭环） [DONE]：权限、参数/时间校验、状态机严格化
- M2（资金闭环） [IN_PROGRESS]：ERC20 资金流整合与事件、失败路径测试（含 epoch）
- M3（证明闭环） [PENDING]：接入 ECDSA 验签与签名者治理
- M4（体验提升） [IN_PROGRESS]：预览金额完善、错误码规范、批量接口
- M5（完备性） [PENDING]：测试全面化与文档
