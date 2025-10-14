mod markfair_token;

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct PoolInfo {
    brand: starknet::ContractAddress,
    token: starknet::ContractAddress,
    attester_pubkey: felt252,
    status: u8,
    funded_amount: core::integer::u256,
    total_claimed_amount: core::integer::u256,
    current_epoch: u64,
    allocated_shares: core::integer::u256,
    unit_k: core::integer::u256,
    merkle_root: felt252,
    deadline_ts: u64,
    refund_after_ts: u64,
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

    fn get_pool(self: @TContractState, pool_id: core::integer::u256) -> core::option::Option<PoolInfo>;

    fn preview_amount(self: @TContractState, pool_id: core::integer::u256, epoch: u64, shares: core::integer::u256) -> core::integer::u256;

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

    // epoch interface (only trusted)
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

    // debugging and frontend/backend utilities
    fn get_epoch_meta(self: @TContractState, pool_id: core::integer::u256, epoch: u64) -> crate::EpochMeta;
    fn get_finalize_nonce(self: @TContractState, pool_id: core::integer::u256, epoch: u64) -> u64;
    fn compute_domain_hash(self: @TContractState, pool_id: core::integer::u256, epoch: u64, merkle_root: felt252, total_shares: core::integer::u256, unit_k: core::integer::u256, deadline_ts: u64, nonce: u64) -> felt252;
    fn verify_epoch_proof(self: @TContractState, pool_id: core::integer::u256, epoch: u64, index: core::integer::u256, account: starknet::ContractAddress, shares: core::integer::u256, amount: core::integer::u256, proof: core::array::Span<felt252>) -> bool;
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
    use core::ecdsa::check_ecdsa_signature as ecdsa_verify;
    use openzeppelin_merkle_tree::merkle_proof::verify;
    use openzeppelin_merkle_tree::hashes::PedersenCHasher;
    use core::hash::{HashStateTrait, HashStateExTrait};
    use core::pedersen::PedersenTrait;

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
    const ERR_BAD_SIG: felt252 = 'BAD_SIG';

    const STATUS_CREATED: u8 = 1_u8;
    const STATUS_FUNDED: u8 = 2_u8;

    // 64-bit threshold (for precise 128x128->256 multiplication without overflow in 64x64 case)
    const MAX_U64: u128 = 18446744073709551615_u128;

    #[storage]
    struct Storage {
        paused: bool,
        pools: Map<u256, super::PoolInfo>,
        owner: ContractAddress,
        reentrancy_guard: bool,
        // V2: epoch data
        // unified use of pools
        epoch_meta: Map<(u256, u64), super::EpochMeta>,
        claimed_epoch: Map<(u256, u64, u256), bool>,
        finalize_nonce: Map<(u256, u64), u64>,
    }

    fn pedersen_hash_many(inputs: Span<felt252>) -> felt252 {
        // retained utility function (for domain_hash etc), decoupled from leaf double hashing
        let n = inputs.len();
        let mut i = 0;
        let mut acc: felt252 = n.into();
        while i != n {
            acc = pedersen(acc, *inputs.at(i));
            i = i + 1;
        }
        acc
    }

    // 128x128 -> 256 precise multiplication (current constraint: both numbers <= 2^64-1)
    // returns u256 where high is always 0, low is 128-bit result.
    fn mul_128x128_to_256_exact_low64(a: u128, b: u128) -> u256 {
        assert(a <= MAX_U64, ERR_OVERFLOW);
        assert(b <= MAX_U64, ERR_OVERFLOW);
        let res_low: u128 = a * b; // 64x64 -> 128 bits, precise no overflow
        u256 { low: res_low, high: 0 }
    }

    const LEAF_TAG: felt252 = 'KOL_LEAF';

    // compute secure hash containing all parameters, using domain tag
    fn compute_secure_hash(
        pool_id: u256,
        epoch: u64,
        index: u256,
        account: ContractAddress,
        shares: u256,
        amount: u256,
    ) -> felt252 {
        let hash_state = PedersenTrait::new(0);
        let finalized = hash_state
            .update_with(LEAF_TAG)        // domain tag: clarify leaf semantics
            .update_with(pool_id)
            .update_with(epoch)
            .update_with(index)
            .update_with(account)
            .update_with(shares)
            .update_with(amount)
            .update_with(7_u8)  // parameter count updated to 7 (including domain tag)
            .finalize();
        finalized
    }

    fn leaf_hash_pedersen(
        pool_id: u256,
        epoch: u64,
        index: u256,
        account: ContractAddress,
        shares: u256,
        amount: u256,
    ) -> felt252 {
        // hybrid method: secure hash + standard leaf format
        // step 1: compute secure hash containing all parameters
        let secure_hash = compute_secure_hash(pool_id, epoch, index, account, shares, amount);
        
        // step 2: use standard OpenZeppelin leaf hash format (excluding parameter count)
        let hash_state = PedersenTrait::new(0);
        let finalized = hash_state
            .update_with(account)
            .update_with(secure_hash)  // use secure hash instead of simple amount
            .finalize();
        pedersen(0, finalized)
    }

    fn domain_hash_finalize(
        pool_id: u256,
        epoch: u64,
        merkle_root: felt252,
        total_shares: u256,
        unit_k: u256,
        deadline_ts: u64,
        nonce: u64,
    ) -> felt252 {
        let mut a = ArrayTrait::new();
        let ca: felt252 = starknet::get_contract_address().into();
        a.append('KOL_FINALIZE');
        a.append(ca);
        a.append(pool_id.low.into()); a.append(pool_id.high.into());
        a.append(epoch.into());
        a.append(merkle_root);
        a.append(total_shares.low.into()); a.append(total_shares.high.into());
        a.append(unit_k.low.into());       a.append(unit_k.high.into());
        a.append(deadline_ts.into());
        a.append(nonce.into());
        pedersen_hash_many(a.span())
    }

    fn non_reentrant_enter(ref self: ContractState) {
        assert(!self.reentrancy_guard.read(), ERR_REENTRANT);
        self.reentrancy_guard.write(true);
    }

    fn non_reentrant_exit(ref self: ContractState) {
        self.reentrancy_guard.write(false);
    }


    // lock-free internal implementation: unified epoch claiming path
    fn _claim_epoch_internal(
        ref self: ContractState,
        pool_id: u256,
        epoch: u64,
        index: u256,
        account: ContractAddress,
        shares: u256,
        amount: u256,
        proof: Span<felt252>,
    ) {
        let mut p: super::PoolInfo = self.pools.read(pool_id);
        assert(p.status != 0_u8, ERR_NO_POOL);
        let mut em: super::EpochMeta = self.epoch_meta.read((pool_id, epoch));
        assert(em.status == 2_u8, ERR_BAD_STATUS);
        let now = get_block_timestamp();
        assert(now <= em.deadline_ts, ERR_DEADLINE);
        if self.claimed_epoch.read((pool_id, epoch, index)) { assert(false, ERR_ALRDY); }

        // amount consistency: restrict high bits to 0, use 64x64->128 precise multiplication
        assert(shares.high == 0, ERR_BAD_SHARES);
        assert(em.unit_k.high == 0, ERR_BAD_UNIT);
            let expected = mul_128x128_to_256_exact_low64(shares.low, em.unit_k.low);
        assert(amount == expected, 'BAD_AMOUNT');

        let leaf = leaf_hash_pedersen(pool_id, epoch, index, account, shares, amount);
        let ok = verify::<PedersenCHasher>(proof, em.merkle_root, leaf);
        assert(ok, 'BAD_PROOF');

        // first write state and accumulate
        self.claimed_epoch.write((pool_id, epoch, index), true);
        let (new_claimed_epoch, of1) = em.claimed_amount.overflowing_add(amount);
        assert(!of1, ERR_OVERFLOW);
        em.claimed_amount = new_claimed_epoch;
        self.epoch_meta.write((pool_id, epoch), em);
        let (new_total_claimed, of2) = p.total_claimed_amount.overflowing_add(amount);
        assert(!of2, ERR_OVERFLOW);
        p.total_claimed_amount = new_total_claimed;
        self.pools.write(pool_id, p);

        // then transfer
        let erc20 = IERC20Dispatcher { contract_address: p.token };
        let ok2 = erc20.transfer(account, amount);
        assert(ok2, ERR_TOUT_FAIL);
        self.emit(Event::ClaimedEpoch(ClaimedEpoch { pool_id, epoch, index, account, shares, amount }));
        self.emit(Event::FundsOut(FundsOut { pool_id, to: account, token: p.token, amount }));
    }

    // -------- Events --------
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Paused: Paused,
        PoolCreated: PoolCreated,
        PoolFunded: PoolFunded,
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
    fn constructor(ref self: ContractState, owner_: ContractAddress) {
        let prev = self.owner.read();
        self.owner.write(owner_);
        self.paused.write(false);
        self.emit(Event::OwnershipTransferred(OwnershipTransferred { previous_owner: prev, new_owner: owner_ }));
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

            // parameter validation
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
                total_claimed_amount: u256 { low: 0, high: 0 },
                current_epoch: 0_u64,
            allocated_shares: u256 { low: 0, high: 0 },
            unit_k: u256 { low: 0, high: 0 },
            merkle_root: 0,
            deadline_ts,
            refund_after_ts,
        };
        self.pools.write(pool_id, info);
            // initialize epoch=0 nonce to 0
            self.finalize_nonce.write((pool_id, 0_u64), 0_u64);
        self.emit(Event::PoolCreated(PoolCreated { pool_id, brand, token }));
    }


        fn get_pool(self: @ContractState, pool_id: u256) -> Option<super::PoolInfo> {
            let p: super::PoolInfo = self.pools.read(pool_id);
            if p.status == 0_u8 { None } else { Some(p) }
        }

    fn preview_amount(self: @ContractState, pool_id: u256, epoch: u64, shares: u256) -> u256 {
            assert(shares.high == 0, ERR_BAD_SHARES);
            
            // Directly use epoch-level unit_k, consistent with actual settlement logic
            let em: super::EpochMeta = self.epoch_meta.read((pool_id, epoch));
            assert(em.unit_k.high == 0, ERR_BAD_UNIT);
            mul_128x128_to_256_exact_low64(shares.low, em.unit_k.low)
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

            // token transfer in
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

        // epoch interface starts
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
            assert_only_owner(@self);
            assert(!self.paused.read(), ERR_PAUSED);
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            assert(p.status != 0_u8, ERR_NO_POOL);
            assert(total_shares > u256 { low: 0, high: 0 }, ERR_BAD_SHARES);
            assert(unit_k > u256 { low: 0, high: 0 }, ERR_BAD_UNIT);
            let now = get_block_timestamp();
            assert(deadline_ts > now, 'BAD_DEADLINE');
            // domain hash + ECDSA signature verification + nonce (using V2 public key)
            let nonce: u64 = self.finalize_nonce.read((pool_id, epoch));
            let expected = domain_hash_finalize(pool_id, epoch, merkle_root, total_shares, unit_k, deadline_ts, nonce);
            assert(_msg_hash == expected, 'BAD_MSG');
            assert(_r != 0, ERR_BAD_SIG);
            assert(_s != 0, ERR_BAD_SIG);
            assert(ecdsa_verify(expected, p.attester_pubkey, _r, _s), ERR_BAD_SIG);

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
            if epoch > p.current_epoch { p.current_epoch = epoch; }
            self.pools.write(pool_id, p);
            self.finalize_nonce.write((pool_id, epoch), nonce + 1_u64);
            self.emit(Event::EpochFinalized(EpochFinalized { pool_id, epoch, merkle_root, total_shares, unit_k, deadline_ts }));
        }

        // lock-free internal implementation: unified epoch claiming path
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
            _claim_epoch_internal(ref self, pool_id, epoch, index, account, shares, amount, proof);
            non_reentrant_exit(ref self);
        }

        fn refund_and_close_epoch(ref self: ContractState, pool_id: u256, epoch: u64, to: ContractAddress) {
            assert_only_owner(@self);
            assert(!self.paused.read(), ERR_PAUSED);
            non_reentrant_enter(ref self);
            let mut p: super::PoolInfo = self.pools.read(pool_id);
            let mut em: super::EpochMeta = self.epoch_meta.read((pool_id, epoch));
            assert(em.status == 2_u8, ERR_BAD_STATUS);
            let now = get_block_timestamp();
            assert(now >= em.refund_after_ts, ERR_NOT_YET);
            // remaining = total_shares*unit_k - claimed_amount (restrict high bits to 0, use 64x64->128 precise multiplication)
            assert(em.total_shares.high == 0, ERR_BAD_SHARES);
            assert(em.unit_k.high == 0, ERR_BAD_UNIT);
            let required = mul_128x128_to_256_exact_low64(em.total_shares.low, em.unit_k.low);
            let (rem, borrow) = required.overflowing_sub(em.claimed_amount);
            assert(!borrow, ERR_UNDERFLOW);
            if rem.low != 0 || rem.high != 0 {
                let erc20 = IERC20Dispatcher { contract_address: p.token };
                let ok = erc20.transfer(to, rem);
                assert(ok, ERR_TOUT_FAIL);
                self.emit(Event::FundsOut(FundsOut { pool_id, to, token: p.token, amount: rem }));
            }
            em.status = 3_u8;
            self.epoch_meta.write((pool_id, epoch), em);
            self.emit(Event::RefundEpoch(RefundEpoch { pool_id, epoch, to, remaining: rem }));
            non_reentrant_exit(ref self);
        }
        // epoch interface ends

        // debugging/utilities (implement trait)
        fn get_epoch_meta(self: @ContractState, pool_id: u256, epoch: u64) -> crate::EpochMeta {
            self.epoch_meta.read((pool_id, epoch))
        }

    fn get_finalize_nonce(self: @ContractState, pool_id: u256, epoch: u64) -> u64 {
        self.finalize_nonce.read((pool_id, epoch))
    }

    fn compute_domain_hash(self: @ContractState, pool_id: u256, epoch: u64, merkle_root: felt252, total_shares: u256, unit_k: u256, deadline_ts: u64, nonce: u64) -> felt252 {
        domain_hash_finalize(pool_id, epoch, merkle_root, total_shares, unit_k, deadline_ts, nonce)
    }

    // read-only: verify if a leaf and proof match the current epoch's merkle_root (for script pre-validation)
    fn verify_epoch_proof(self: @ContractState, pool_id: u256, epoch: u64, index: u256, account: ContractAddress, shares: u256, amount: u256, proof: Span<felt252>) -> bool {
        let em: super::EpochMeta = self.epoch_meta.read((pool_id, epoch));
        let leaf = leaf_hash_pedersen(pool_id, epoch, index, account, shares, amount);
        let ok = verify::<PedersenCHasher>(proof, em.merkle_root, leaf);
        ok
        }
    }
}
