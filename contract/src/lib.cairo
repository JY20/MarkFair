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
}

#[starknet::contract]
mod KolEscrow {
    use core::option::Option;
    use core::option::Option::{Some, None};
    use core::integer::u256;
    use core::num::traits::{OverflowingAdd, OverflowingSub};
    use core::array::Span;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::Map;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess,
    };

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
        OwnershipTransferred: OwnershipTransferred,
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

    fn assert_only_owner(self: @ContractState) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'NOT_OWNER');
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
            assert(!self.paused.read(), 'PAUSED');
            let existing: super::PoolInfo = self.pools.read(pool_id);
            assert(existing.status == 0_u8, 'POOL_EXISTS');

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
            assert(!self.paused.read(), 'PAUSED');
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, 'NO_POOL');
            assert(p.status == STATUS_CREATED || p.status == STATUS_FUNDED, 'BAD_STATUS');

            let (sum, overflow) = p.funded_amount.overflowing_add(amount);
            assert(!overflow, 'OVERFLOW');
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
            assert(!self.paused.read(), 'PAUSED');
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, 'NO_POOL');
            assert(p.status == STATUS_FUNDED, 'BAD_STATUS');

            let _unused = (msg_hash, sig_r, sig_s);

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
            assert(!self.paused.read(), 'PAUSED');
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, 'NO_POOL');
            assert(p.status == STATUS_FINALIZED, 'BAD_STATUS');

            let now = get_block_timestamp();
            assert(now <= p.deadline_ts, 'DEADLINE');

            if self.claimed.read((pool_id, index)) { assert(false, 'ALREADY'); }

            let _ = proof;

            self.claimed.write((pool_id, index), true);

            let (new_total, overflow2) = p.total_claimed_amount.overflowing_add(amount);
            assert(!overflow2, 'OVERFLOW');
            p.total_claimed_amount = new_total;

            self.pools.write(pool_id, p);
            self.emit(Event::Claimed(Claimed { pool_id, index, account, shares, amount }));
        }

        fn refund_and_close(ref self: ContractState, pool_id: u256, to: ContractAddress) {
            assert_only_owner(@self);
            assert(!self.paused.read(), 'PAUSED');
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, 'NO_POOL');
            assert(p.status == STATUS_FINALIZED, 'BAD_STATUS');

            let now = get_block_timestamp();
            assert(now >= p.refund_after_ts, 'NOT_YET');

            let (rem, borrow) = p.funded_amount.overflowing_sub(p.total_claimed_amount);
            assert(!borrow, 'UNDERFLOW');

            p.status = STATUS_CLOSED;
            self.pools.write(pool_id, p);
            self.emit(Event::Refund(Refund { pool_id, to, remaining: rem }));
        }

        fn get_pool(self: @ContractState, pool_id: u256) -> Option<super::PoolInfo> {
            let p: super::PoolInfo = self.pools.read(pool_id);
            if p.status == 0_u8 { None } else { Some(p) }
        }

        fn preview_amount(self: @ContractState, _pool_id: u256, shares: u256) -> u256 {
            // 占位：实际应为 shares * unit_k（需要 u256 乘法，后续按需替换）
            shares
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
    }
}
