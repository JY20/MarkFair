use starknet::ContractAddress;
use core::integer::u256;
use core::traits::TryInto;

use snforge_std_deprecated::{declare, ContractClassTrait, DeclareResultTrait};

use contract::IKolEscrowDispatcher;
use contract::IKolEscrowDispatcherTrait;

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

#[test]
fn test_create_pool_and_get_pool() {
    let contract_address = deploy_contract("KolEscrow");

    let dispatcher = IKolEscrowDispatcher { contract_address };

    let pool_id = u256 { low: 1, high: 0 };
    let brand: ContractAddress = 1.try_into().unwrap();
    let token: ContractAddress = 2.try_into().unwrap();
    let attester_pubkey = 0;
    let deadline_ts: u64 = 1000;
    let refund_after_ts: u64 = 2000;

    dispatcher.create_pool(pool_id, brand, token, attester_pubkey, deadline_ts, refund_after_ts);

    match dispatcher.get_pool(pool_id) {
        Option::Some(_p) => {
            assert(dispatcher.get_pool_status(pool_id) == 1_u8, 'status not CREATED');
            assert(dispatcher.get_pool_brand(pool_id) == brand, 'brand mismatch');
            assert(dispatcher.get_pool_token(pool_id) == token, 'token mismatch');
        },
        Option::None => core::panic_with_felt252('pool not found'),
    }
}

#[test]
fn test_fund_pool_updates_amount_and_status() {
    let contract_address = deploy_contract("KolEscrow");

    let dispatcher = IKolEscrowDispatcher { contract_address };

    let pool_id = u256 { low: 7, high: 0 };
    let brand: ContractAddress = 3.try_into().unwrap();
    let token: ContractAddress = 4.try_into().unwrap();
    let attester_pubkey = 0;
    let deadline_ts: u64 = 1000;
    let refund_after_ts: u64 = 2000;

    dispatcher.create_pool(pool_id, brand, token, attester_pubkey, deadline_ts, refund_after_ts);

    let five = u256 { low: 5, high: 0 };
    dispatcher.fund_pool(pool_id, five);

    match dispatcher.get_pool(pool_id) {
        Option::Some(_p) => {
            assert(dispatcher.get_pool_status(pool_id) == 2_u8, 'status not FUNDED');
            assert(dispatcher.get_pool_funded(pool_id) == five, 'funded_amount mismatch');
        },
        Option::None => core::panic_with_felt252('pool not found after fund'),
    }
}
