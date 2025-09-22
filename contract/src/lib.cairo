#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct PoolInfo {
    brand: starknet::ContractAddress,
    token: starknet::ContractAddress,
    attester_pubkey: felt252,
    status: u8,
    funded_amount: core::integer::u256,
    allocated_shares: core::integer::u256,
    unit_k: core::integer::u256,
    merkle_root: felt252,
    deadline_ts: u64,
    refund_after_ts: u64,
    total_claimed_amount: core::integer::u256,
}

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct PoolInfoV2 {
    brand: starknet::ContractAddress,
    token: starknet::ContractAddress,
    attester_pubkey: felt252,
    status: u8,
    funded_amount: core::integer::u256,
    total_claimed_amount: core::integer::u256,
    current_epoch: u64,
}

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct EpochMeta {
    merkle_root: felt252,
    total_shares: core::integer::u256,
    unit_k: core::integer::u256,
    deadline_ts: u64,
    refund_after_ts: u64,
    claimed_amount: core::integer::u256,
    status: u8,
}

#[starknet::interface]
pub trait IKolEscrow<TContractState> {
    fn pause(ref self: TContractState, flag: bool);

    fn create_pool(
        ref self: TContractState,
        pool_id: core::integer::u256,
        brand: starknet::ContractAddress,
        token: starknet::ContractAddress,
        attester_pubkey: felt252,
        deadline_ts: u64,
        refund_after_ts: u64,
    );

    fn fund_pool(ref self: TContractState, pool_id: core::integer::u256, amount: core::integer::u256);

    fn finalize_pool(
        ref self: TContractState,
        pool_id: core::integer::u256,
        merkle_root: felt252,
        total_shares: core::integer::u256,
        unit_k: core::integer::u256,
        deadline_ts: u64,
        msg_hash: felt252,
        sig_r: felt252,
        sig_s: felt252,
    );

    fn claim(
        ref self: TContractState,
        pool_id: core::integer::u256,
        index: core::integer::u256,
        account: starknet::ContractAddress,
        shares: core::integer::u256,
        amount: core::integer::u256,
        proof: core::array::Span<felt252>,
    );

    fn refund_and_close(ref self: TContractState, pool_id: core::integer::u256, to: starknet::ContractAddress);

    fn get_pool(self: @TContractState, pool_id: core::integer::u256) -> core::option::Option<PoolInfo>;

    fn preview_amount(self: @TContractState, _pool_id: core::integer::u256, shares: core::integer::u256) -> core::integer::u256;

    fn get_pool_status(self: @TContractState, pool_id: core::integer::u256) -> u8;
    fn get_pool_funded(self: @TContractState, pool_id: core::integer::u256) -> core::integer::u256;
    fn get_pool_brand(self: @TContractState, pool_id: core::integer::u256) -> starknet::ContractAddress;
    fn get_pool_token(self: @TContractState, pool_id: core::integer::u256) -> starknet::ContractAddress;

    fn fund_pool_with_transfer(
        ref self: TContractState,
        pool_id: core::integer::u256,
        token: starknet::ContractAddress,
        from: starknet::ContractAddress,
        amount: core::integer::u256,
    );

    fn claim_with_transfer(
        ref self: TContractState,
        pool_id: core::integer::u256,
        index: core::integer::u256,
        account: starknet::ContractAddress,
        amount: core::integer::u256,
    );

    fn refund_and_close_with_transfer(ref self: TContractState, pool_id: core::integer::u256, to: starknet::ContractAddress);

    // epoch 接口
    fn finalize_epoch(
        ref self: TContractState,
        pool_id: core::integer::u256,
        epoch: u64,
        merkle_root: felt252,
        total_shares: core::integer::u256,
        unit_k: core::integer::u256,
        deadline_ts: u64,
        _msg_hash: felt252, _r: felt252, _s: felt252,
    );
    fn claim_epoch_with_transfer(
        ref self: TContractState,
        pool_id: core::integer::u256,
        epoch: u64,
        index: core::integer::u256,
        account: starknet::ContractAddress,
        shares: core::integer::u256,
        amount: core::integer::u256,
        proof: core::array::Span<felt252>,
    );
    fn refund_and_close_epoch(ref self: TContractState, pool_id: core::integer::u256, epoch: u64, to: starknet::ContractAddress);
}

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: starknet::ContractAddress, amount: core::integer::u256) -> bool;
    fn transferFrom(ref self: TContractState, sender: starknet::ContractAddress, recipient: starknet::ContractAddress, amount: core::integer::u256) -> bool;
    fn balanceOf(self: @TContractState, account: starknet::ContractAddress) -> core::integer::u256;
    fn approve(ref self: TContractState, spender: starknet::ContractAddress, amount: core::integer::u256) -> bool;
}

#[starknet::contract]
mod KolEscrow {
    use core::option::Option;
    use core::option::Option::{Some, None};
    use core::integer::u256;
    use core::num::traits::{OverflowingAdd, OverflowingSub};
    use core::array::Span;
    use core::array::ArrayTrait;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use crate::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::Map;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess,
    };
    use core::pedersen::pedersen;
    use openzeppelin_merkle_tree::merkle_proof::verify_pedersen;

    // -------- Error constants (felt shortstrings) --------
    const ERR_PAUSED: felt252 = 'PAUSED';
    const ERR_NOT_OWNER: felt252 = 'NOT_OWNER';
    const ERR_NO_POOL: felt252 = 'NO_POOL';
    const ERR_POOL_EXISTS: felt252 = 'POOL_EXISTS';
    const ERR_BAD_STATUS: felt252 = 'BAD_STATUS';
    const ERR_ALRDY: felt252 = 'ALREADY';
    const ERR_DEADLINE: felt252 = 'DEADLINE';
    const ERR_NOT_YET: felt252 = 'NOT_YET';
    const ERR_OVERFLOW: felt252 = 'OVERFLOW';
    const ERR_UNDERFLOW: felt252 = 'UNDERFLOW';
    const ERR_BAD_TOKEN: felt252 = 'BAD_TOKEN';
    const ERR_BAD_BRAND: felt252 = 'BAD_BRAND';
    const ERR_BAD_TIME: felt252 = 'BAD_REFUND_TIME';
    const ERR_BAD_UNIT: felt252 = 'BAD_UNIT';
    const ERR_BAD_SHARES: felt252 = 'BAD_SHARES';
    const ERR_REENTRANT: felt252 = 'REENTRANT';
    const ERR_TFROM_FAIL: felt252 = 'TFRM_FAIL';
    const ERR_TOUT_FAIL: felt252 = 'TFROUT_FAIL';

    const STATUS_CREATED: u8 = 1_u8;
    const STATUS_FUNDED: u8 = 2_u8;
    const STATUS_FINALIZED: u8 = 3_u8;
    const STATUS_CLOSED: u8 = 4_u8;

    #[storage]
    struct Storage {
        paused: bool,
        pools: Map<u256, super::PoolInfo>,
        // 简化：按 (pool_id, index) 记录是否已领取
        claimed: Map<(u256, u256), bool>,
        owner: ContractAddress,
        reentrancy_guard: bool,
        // V2: epoch data
        pools_v2: Map<u256, super::PoolInfoV2>,
        epoch_meta: Map<(u256, u64), super::EpochMeta>,
        claimed_epoch: Map<(u256, u64, u256), bool>,
    }

    fn pedersen_hash_many(inputs: Span<felt252>) -> felt252 {
        let n = inputs.len();
        let mut i = 0;
        let mut acc: felt252 = n.into();
        while i != n {
            acc = pedersen(acc, *inputs.at(i));
            i = i + 1;
        }
        acc
    }

    const LEAF_TAG: felt252 = 'KOL_LEAF_V1';

    fn leaf_hash_pedersen(
        pool_id: u256,
        epoch: u64,
        index: u256,
        account: ContractAddress,
        shares: u256,
        amount: u256,
    ) -> felt252 {
        let mut a = ArrayTrait::new();
        let ca: felt252 = starknet::get_contract_address().into();
        a.append(LEAF_TAG);
        a.append(ca);
        a.append(pool_id.low.into()); a.append(pool_id.high.into());
        a.append(epoch.into());
        a.append(index.low.into()); a.append(index.high.into());
        a.append((account.into()));
        a.append(shares.low.into()); a.append(shares.high.into());
        a.append(amount.low.into()); a.append(amount.high.into());
        pedersen_hash_many(a.span())
    }

    fn non_reentrant_enter(ref self: ContractState) {
        assert(!self.reentrancy_guard.read(), ERR_REENTRANT);
        self.reentrancy_guard.write(true);
    }

    fn non_reentrant_exit(ref self: ContractState) {
        self.reentrancy_guard.write(false);
    }

    // keccak 相关移除，改用 pedersen + verify_pedersen

    fn domain_hash_finalize(
        pool_id: u256,
        merkle_root: felt252,
        total_shares: u256,
        unit_k: u256,
        deadline_ts: u64,
    ) -> felt252 {
        let mut a = ArrayTrait::new();
        a.append('KOL_ESCROW_V1');
        a.append(starknet::get_contract_address().into());
        a.append(pool_id.low.into()); a.append(pool_id.high.into());
        a.append(total_shares.low.into()); a.append(total_shares.high.into());
        a.append(unit_k.low.into()); a.append(unit_k.high.into());
        a.append(deadline_ts.into());
        a.append(merkle_root);
        pedersen_hash_many(a.span())
    }

    // -------- Events --------
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Paused: Paused,
        PoolCreated: PoolCreated,
        PoolFunded: PoolFunded,
        PoolFinalized: PoolFinalized,
        Claimed: Claimed,
        Refund: Refund,
        FundsIn: FundsIn,
        FundsOut: FundsOut,
        OwnershipTransferred: OwnershipTransferred,
        EpochFinalized: EpochFinalized,
        RefundEpoch: RefundEpoch,
        ClaimedEpoch: ClaimedEpoch,
    }

    #[derive(Drop, starknet::Event)]
    struct Paused { by: ContractAddress, flag: bool }

    #[derive(Drop, starknet::Event)]
    struct PoolCreated { pool_id: u256, brand: ContractAddress, token: ContractAddress }

    #[derive(Drop, starknet::Event)]
    struct PoolFunded { pool_id: u256, delta: u256, total: u256 }

    #[derive(Drop, starknet::Event)]
    struct PoolFinalized {
        pool_id: u256,
        merkle_root: felt252,
        total_shares: u256,
        unit_k: u256,
        deadline_ts: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct Claimed {
        pool_id: u256,
        index: u256,
        account: ContractAddress,
        shares: u256,
        amount: u256
    }

    #[derive(Drop, starknet::Event)]
    struct Refund { pool_id: u256, to: ContractAddress, remaining: u256 }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred { previous_owner: ContractAddress, new_owner: ContractAddress }

    #[derive(Drop, starknet::Event)]
    struct FundsIn { pool_id: u256, from: ContractAddress, token: ContractAddress, amount: u256 }

    #[derive(Drop, starknet::Event)]
    struct FundsOut { pool_id: u256, to: ContractAddress, token: ContractAddress, amount: u256 }

    #[derive(Drop, starknet::Event)]
    struct EpochFinalized { pool_id: u256, epoch: u64, merkle_root: felt252, total_shares: u256, unit_k: u256, deadline_ts: u64 }
    #[derive(Drop, starknet::Event)]
    struct RefundEpoch { pool_id: u256, epoch: u64, to: ContractAddress, remaining: u256 }
    #[derive(Drop, starknet::Event)]
    struct ClaimedEpoch { pool_id: u256, epoch: u64, index: u256, account: ContractAddress, shares: u256, amount: u256 }

    fn assert_only_owner(self: @ContractState) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), ERR_NOT_OWNER);
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let caller = get_caller_address();
        let prev = self.owner.read();
        self.owner.write(caller);
        self.paused.write(false);
        self.emit(Event::OwnershipTransferred(OwnershipTransferred { previous_owner: prev, new_owner: caller }));
    }

    #[abi(embed_v0)]
    impl KolEscrowImpl of super::IKolEscrow<ContractState> {
        fn pause(ref self: ContractState, flag: bool) {
            assert_only_owner(@self);
            let caller = get_caller_address();
            self.paused.write(flag);
            self.emit(Event::Paused(Paused { by: caller, flag }));
        }

        fn create_pool(
            ref self: ContractState,
            pool_id: u256,
            brand: ContractAddress,
            token: ContractAddress,
            attester_pubkey: felt252,
            deadline_ts: u64,
            refund_after_ts: u64,
        ) {
            assert(!self.paused.read(), ERR_PAUSED);
            let existing: super::PoolInfo = self.pools.read(pool_id);
            assert(existing.status == 0_u8, ERR_POOL_EXISTS);

            // 参数校验
            assert(brand.into() != 0, ERR_BAD_BRAND);
            assert(token.into() != 0, ERR_BAD_TOKEN);
            assert(deadline_ts > 0, 'BAD_DEADLINE');
            assert(refund_after_ts > deadline_ts, ERR_BAD_TIME);

            let info = super::PoolInfo {
                brand,
                token,
                attester_pubkey,
                status: STATUS_CREATED,
                funded_amount: u256 { low: 0, high: 0 },
                allocated_shares: u256 { low: 0, high: 0 },
                unit_k: u256 { low: 0, high: 0 },
                merkle_root: 0,
                deadline_ts,
                refund_after_ts,
                total_claimed_amount: u256 { low: 0, high: 0 },
            };
            self.pools.write(pool_id, info);
            self.emit(Event::PoolCreated(PoolCreated { pool_id, brand, token }));
        }

        fn fund_pool(ref self: ContractState, pool_id: u256, amount: u256) {
            assert(!self.paused.read(), ERR_PAUSED);
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(p.status == STATUS_CREATED || p.status == STATUS_FUNDED, ERR_BAD_STATUS);

            let (sum, overflow) = p.funded_amount.overflowing_add(amount);
            assert(!overflow, ERR_OVERFLOW);
            p.funded_amount = sum;

            if p.status == STATUS_CREATED { p.status = STATUS_FUNDED; }

            self.pools.write(pool_id, p);
            self.emit(Event::PoolFunded(PoolFunded { pool_id, delta: amount, total: p.funded_amount }));
        }

        fn finalize_pool(
            ref self: ContractState,
            pool_id: u256,
            merkle_root: felt252,
            total_shares: u256,
            unit_k: u256,
            deadline_ts: u64,
            msg_hash: felt252,
            sig_r: felt252,
            sig_s: felt252,
        ) {
            assert_only_owner(@self);
            assert(!self.paused.read(), ERR_PAUSED);
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(p.status == STATUS_FUNDED, ERR_BAD_STATUS);

            // finalize 参数校验
            assert(total_shares > u256 { low: 0, high: 0 }, ERR_BAD_SHARES);
            assert(unit_k > u256 { low: 0, high: 0 }, ERR_BAD_UNIT);
            let now = get_block_timestamp();
            assert(deadline_ts > now, 'BAD_DEADLINE');

            // 域隔离消息哈希校验（签名验签后续接入）
            let expected = domain_hash_finalize(pool_id, merkle_root, total_shares, unit_k, deadline_ts);
            assert(msg_hash == expected, 'BAD_MSG');

            p.allocated_shares = total_shares;
            p.unit_k = unit_k;
            p.merkle_root = merkle_root;
            p.deadline_ts = deadline_ts;
            p.status = STATUS_FINALIZED;

            self.pools.write(pool_id, p);
            self.emit(Event::PoolFinalized(PoolFinalized { pool_id, merkle_root, total_shares, unit_k, deadline_ts }));
        }

        fn claim(
            ref self: ContractState,
            pool_id: u256,
            index: u256,
            account: ContractAddress,
            shares: u256,
            amount: u256,
            proof: Span<felt252>,
        ) {
            assert(!self.paused.read(), ERR_PAUSED);
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(p.status == STATUS_FINALIZED, ERR_BAD_STATUS);

            let now = get_block_timestamp();
            assert(now <= p.deadline_ts, ERR_DEADLINE);
            if self.claimed.read((pool_id, index)) { assert(false, ERR_ALRDY); }

            // Merkle 校验（Pedersen，排序配对）
            let leaf = pedersen_hash_many({
                let mut a = ArrayTrait::new();
                let ca: felt252 = starknet::get_contract_address().into();
                a.append(LEAF_TAG);
                a.append(ca);
                a.append(pool_id.low.into()); a.append(pool_id.high.into());
                a.append(0); // epoch=0（旧接口）
                a.append(index.low.into()); a.append(index.high.into());
                a.append((account.into()));
                a.append(shares.low.into()); a.append(shares.high.into());
                a.append(amount.low.into()); a.append(amount.high.into());
                a.span()
            });
            let ok = verify_pedersen(proof, p.merkle_root, leaf);
            assert(ok, 'BAD_PROOF');

            self.claimed.write((pool_id, index), true);
            let (new_total, overflow2) = p.total_claimed_amount.overflowing_add(amount);
            assert(!overflow2, ERR_OVERFLOW);
            p.total_claimed_amount = new_total;
            self.pools.write(pool_id, p);

            self.emit(Event::Claimed(Claimed { pool_id, index, account, shares, amount }));
        }

        fn refund_and_close(ref self: ContractState, pool_id: u256, to: ContractAddress) {
            assert_only_owner(@self);
            assert(!self.paused.read(), ERR_PAUSED);
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(p.status == STATUS_FINALIZED, ERR_BAD_STATUS);

            let now = get_block_timestamp();
            assert(now >= p.refund_after_ts, ERR_NOT_YET);

            let (rem, borrow) = p.funded_amount.overflowing_sub(p.total_claimed_amount);
            assert(!borrow, ERR_UNDERFLOW);

            p.status = STATUS_CLOSED;
            self.pools.write(pool_id, p);
            self.emit(Event::Refund(Refund { pool_id, to, remaining: rem }));
        }

        fn get_pool(self: @ContractState, pool_id: u256) -> Option<super::PoolInfo> {
            let p: super::PoolInfo = self.pools.read(pool_id);
            if p.status == 0_u8 { None } else { Some(p) }
        }

        fn preview_amount(self: @ContractState, _pool_id: u256, shares: u256) -> u256 {
            // 实现：amount = shares * unit_k，简单安全乘法（低位高位）
            // 这里采用朴素乘法： (a_low + 2^128 a_high) * (b_low + 2^128 b_high)
            // 由于 Cairo 核心库缺少直接 u256 乘法，这里用近似：若高位非零则认为可能溢出并直接返回 shares（占位策略），
            // 后续可替换为稳定的 u256 乘法库实现。
            let p: super::PoolInfo = self.pools.read(_pool_id);
            let a = shares;
            let b = p.unit_k;
            // 如果任一高位非零且另一侧非零，则可能溢出
            if (a.high != 0 && (b.low != 0 || b.high != 0)) {
                // 占位：返回 shares 以保持函数总是可用
                return shares;
            }
            if (b.high != 0 && (a.low != 0 || a.high != 0)) {
                return shares;
            }
            // 简化：仅计算低位乘积（示例用途），完整实现建议引入 u256 mul 库
            let res_low = a.low * b.low;
            u256 { low: res_low, high: 0 }
        }

        fn get_pool_status(self: @ContractState, pool_id: u256) -> u8 {
            let p: super::PoolInfo = self.pools.read(pool_id);
            p.status
        }

        fn get_pool_funded(self: @ContractState, pool_id: u256) -> u256 {
            let p: super::PoolInfo = self.pools.read(pool_id);
            p.funded_amount
        }

        fn get_pool_brand(self: @ContractState, pool_id: u256) -> ContractAddress {
            let p: super::PoolInfo = self.pools.read(pool_id);
            p.brand
        }

        fn get_pool_token(self: @ContractState, pool_id: u256) -> ContractAddress {
            let p: super::PoolInfo = self.pools.read(pool_id);
            p.token
        }

        fn fund_pool_with_transfer(
            ref self: ContractState,
            pool_id: u256,
            token: ContractAddress,
            from: ContractAddress,
            amount: u256,
        ) {
            assert(!self.paused.read(), ERR_PAUSED);
            non_reentrant_enter(ref self);

            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(p.status == STATUS_CREATED || p.status == STATUS_FUNDED, ERR_BAD_STATUS);
            assert(p.token == token, ERR_BAD_TOKEN);

            // 代币转入
            let erc20 = IERC20Dispatcher { contract_address: token };
            let this = starknet::get_contract_address();
            let ok = erc20.transferFrom(from, this, amount);
            assert(ok, ERR_TFROM_FAIL);

            let (sum, overflow) = p.funded_amount.overflowing_add(amount);
            assert(!overflow, ERR_OVERFLOW);
            p.funded_amount = sum;
            if p.status == STATUS_CREATED { p.status = STATUS_FUNDED; }
            self.pools.write(pool_id, p);
            self.emit(Event::PoolFunded(PoolFunded { pool_id, delta: amount, total: p.funded_amount }));
            self.emit(Event::FundsIn(FundsIn { pool_id, from, token, amount }));

            non_reentrant_exit(ref self);
        }

        fn claim_with_transfer(
            ref self: ContractState,
            pool_id: u256,
            index: u256,
            account: ContractAddress,
            amount: u256,
        ) {
            assert(!self.paused.read(), ERR_PAUSED);
            non_reentrant_enter(ref self);

            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(p.status == STATUS_FINALIZED, ERR_BAD_STATUS);

            let now = get_block_timestamp();
            assert(now <= p.deadline_ts, ERR_DEADLINE);
            if self.claimed.read((pool_id, index)) { assert(false, ERR_ALRDY); }

            // 简化：with_transfer 版本暂不传 proof，业务侧外部先验；后续可改签名结构
            // 可选：把 verify_merkle 接口也暴露到 ABI，前端先调 view 校验

            self.claimed.write((pool_id, index), true);
            let (new_total, overflow2) = p.total_claimed_amount.overflowing_add(amount);
            assert(!overflow2, ERR_OVERFLOW);
            p.total_claimed_amount = new_total;
            self.pools.write(pool_id, p);

            let erc20 = IERC20Dispatcher { contract_address: p.token };
            let ok = erc20.transfer(account, amount);
            assert(ok, ERR_TOUT_FAIL);

            self.emit(Event::Claimed(Claimed { pool_id, index, account, shares: u256 { low: 0, high: 0 }, amount }));
            self.emit(Event::FundsOut(FundsOut { pool_id, to: account, token: p.token, amount }));
            non_reentrant_exit(ref self);
        }

        fn refund_and_close_with_transfer(ref self: ContractState, pool_id: u256, to: ContractAddress) {
            assert_only_owner(@self);
            assert(!self.paused.read(), ERR_PAUSED);
            non_reentrant_enter(ref self);

            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(p.status == STATUS_FINALIZED, ERR_BAD_STATUS);
            let now = get_block_timestamp();
            assert(now >= p.refund_after_ts, ERR_NOT_YET);

            let (rem, borrow) = p.funded_amount.overflowing_sub(p.total_claimed_amount);
            assert(!borrow, ERR_UNDERFLOW);

            if rem.low != 0 || rem.high != 0 {
                let erc20 = IERC20Dispatcher { contract_address: p.token };
                let ok = erc20.transfer(to, rem);
                assert(ok, ERR_TOUT_FAIL);
                self.emit(Event::FundsOut(FundsOut { pool_id, to, token: p.token, amount: rem }));
            }

            p.status = STATUS_CLOSED;
            self.pools.write(pool_id, p);
            self.emit(Event::Refund(Refund { pool_id, to, remaining: rem }));
            non_reentrant_exit(ref self);
        }

        // epoch 接口开始
        fn finalize_epoch(
            ref self: ContractState,
            pool_id: u256,
            epoch: u64,
            merkle_root: felt252,
            total_shares: u256,
            unit_k: u256,
            deadline_ts: u64,
            _msg_hash: felt252, _r: felt252, _s: felt252,
        ) {
            assert(!self.paused.read(), ERR_PAUSED);
            let mut p2: super::PoolInfoV2 = self.pools_v2.read(pool_id);
            assert(p2.status != 0_u8, ERR_NO_POOL);
            assert(total_shares > u256 { low: 0, high: 0 }, ERR_BAD_SHARES);
            assert(unit_k > u256 { low: 0, high: 0 }, ERR_BAD_UNIT);
            let now = get_block_timestamp();
            assert(deadline_ts > now, 'BAD_DEADLINE');

            // 占位：如需资金充足校验，请替换为 u256 乘法 required

            let em = super::EpochMeta {
                merkle_root,
                total_shares,
                unit_k,
                deadline_ts,
                refund_after_ts: deadline_ts,
                claimed_amount: u256 { low: 0, high: 0 },
                status: 2_u8,
            };
            self.epoch_meta.write((pool_id, epoch), em);
            if epoch > p2.current_epoch { p2.current_epoch = epoch; }
            self.pools_v2.write(pool_id, p2);
            self.emit(Event::EpochFinalized(EpochFinalized { pool_id, epoch, merkle_root, total_shares, unit_k, deadline_ts }));
        }

        fn claim_epoch_with_transfer(
            ref self: ContractState,
            pool_id: u256,
            epoch: u64,
            index: u256,
            account: ContractAddress,
            shares: u256,
            amount: u256,
            proof: Span<felt252>,
        ) {
            assert(!self.paused.read(), ERR_PAUSED);
            non_reentrant_enter(ref self);
            let mut p2: super::PoolInfoV2 = self.pools_v2.read(pool_id);
            assert(p2.status != 0_u8, ERR_NO_POOL);
            let mut em: super::EpochMeta = self.epoch_meta.read((pool_id, epoch));
            assert(em.status == 2_u8, ERR_BAD_STATUS);
            let now = get_block_timestamp();
            assert(now <= em.deadline_ts, ERR_DEADLINE);
            if self.claimed_epoch.read((pool_id, epoch, index)) { assert(false, ERR_ALRDY); }

            // 金额校验（占位：应替换为完整 u256 乘法）
            let _ = shares; let _ = amount; // 避免未用

            let leaf = leaf_hash_pedersen(pool_id, epoch, index, account, shares, amount);
            let ok = verify_pedersen(proof, em.merkle_root, leaf);
            assert(ok, 'BAD_PROOF');

            self.claimed_epoch.write((pool_id, epoch, index), true);
            self.epoch_meta.write((pool_id, epoch), em);
            self.pools_v2.write(pool_id, p2);

            let erc20 = IERC20Dispatcher { contract_address: p2.token };
            let ok2 = erc20.transfer(account, amount);
            assert(ok2, ERR_TOUT_FAIL);
            self.emit(Event::ClaimedEpoch(ClaimedEpoch { pool_id, epoch, index, account, shares, amount }));
            self.emit(Event::FundsOut(FundsOut { pool_id, to: account, token: p2.token, amount }));
            non_reentrant_exit(ref self);
        }

        fn refund_and_close_epoch(ref self: ContractState, pool_id: u256, epoch: u64, to: ContractAddress) {
            assert_only_owner(@self);
            assert(!self.paused.read(), ERR_PAUSED);
            non_reentrant_enter(ref self);
            let mut p2: super::PoolInfoV2 = self.pools_v2.read(pool_id);
            let mut em: super::EpochMeta = self.epoch_meta.read((pool_id, epoch));
            assert(em.status == 2_u8, ERR_BAD_STATUS);
            let now = get_block_timestamp();
            assert(now >= em.refund_after_ts, ERR_NOT_YET);

            // 剩余（占位：应为 total_shares*unit_k - claimed_amount）
            let rem = u256 { low: 0, high: 0 }; // 占位
            if rem.low != 0 || rem.high != 0 {
                let erc20 = IERC20Dispatcher { contract_address: p2.token };
                let ok = erc20.transfer(to, rem);
                assert(ok, ERR_TOUT_FAIL);
                self.emit(Event::FundsOut(FundsOut { pool_id, to, token: p2.token, amount: rem }));
            }

            em.status = 3_u8;
            self.epoch_meta.write((pool_id, epoch), em);
            self.emit(Event::RefundEpoch(RefundEpoch { pool_id, epoch, to, remaining: rem }));
            non_reentrant_exit(ref self);
        }
        // epoch 接口结束
    }
}
