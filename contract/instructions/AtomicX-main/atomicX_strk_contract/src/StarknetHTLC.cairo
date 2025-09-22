use starknet::ContractAddress;
use core::integer::u256;

// HTLC structure to store all details about a hash time-locked contract
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct HTLC {
    sender: ContractAddress,
    recipient: ContractAddress,
    token: ContractAddress,
    amount: u256,
    hashlock: felt252,
    timelock: u64,
    withdrawn: bool,
    refunded: bool,
    created_at: u64,
}

// Interface for the HTLC contract
#[starknet::interface]
pub trait IHTLC<TContractState> {
    fn create_htlc(
        ref self: TContractState,
        hashlock: felt252,
        recipient: ContractAddress,
        token: ContractAddress,
        amount_low: felt252,  // Low bits of amount
        amount_high: felt252, // High bits of amount
        timelock: u64
    ) -> felt252;
    
    fn withdraw(ref self: TContractState, htlc_id: felt252, secret: felt252);
    
    fn refund(ref self: TContractState, htlc_id: felt252);
    
    fn get_htlc(self: @TContractState, htlc_id: felt252) -> HTLC;
    
    // New function to get token balance for any address
    fn get_balance(self: @TContractState, token_address: ContractAddress, user_address: ContractAddress) -> u256;
    
    // Function to deposit funds directly into the contract
    fn deposit_funds(
        ref self: TContractState, 
        token: ContractAddress, 
        amount_low: felt252,  // Low bits of amount
        amount_high: felt252  // High bits of amount
    ) -> bool;
}

// Define the ERC20 interface for token transfers
#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transferFrom(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn balanceOf(self: @TContractState, account: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::contract]
mod StarknetHTLC {
    use super::{HTLC, IERC20DispatcherTrait, IERC20Dispatcher};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use core::keccak::keccak_u256s_be_inputs;
    use core::integer::u256;
    use core::array::ArrayTrait;
    use core::traits::Into;
    
    #[feature("deprecated_legacy_map")]
    #[storage]
    struct Storage {
        htlcs: LegacyMap::<felt252, HTLC>,
        next_htlc_id: felt252,
    }
    
    #[event]
#[derive(Drop, starknet::Event)]
enum Event {
    HTLCCreated: HTLCCreated,
    HTLCWithdrawn: HTLCWithdrawn,
    HTLCRefunded: HTLCRefunded,
    FundsDeposited: FundsDeposited,
}
    
    #[derive(Drop, starknet::Event)]
    struct HTLCCreated {
        htlc_id: felt252,
        sender: ContractAddress,
        recipient: ContractAddress,
        token: ContractAddress,
        amount: u256,
        hashlock: felt252,
        timelock: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct HTLCWithdrawn {
        htlc_id: felt252,
        secret: felt252,
    }
    
    #[derive(Drop, starknet::Event)]
struct HTLCRefunded {
    htlc_id: felt252,
}

#[derive(Drop, starknet::Event)]
struct FundsDeposited {
    sender: ContractAddress,
    token: ContractAddress,
    amount: u256,
    timestamp: u64,
}
    
    #[constructor]
    fn constructor(ref self: ContractState) {
        self.next_htlc_id.write(1);
    }
    
    #[abi(embed_v0)]
    impl HTLCImpl of super::IHTLC<ContractState> {
        // Create a new HTLC
        fn create_htlc(
            ref self: ContractState,
            hashlock: felt252,
            recipient: ContractAddress,
            token: ContractAddress,
            amount_low: felt252,  // Low bits of amount
            amount_high: felt252, // High bits of amount
            timelock: u64
        ) -> felt252 {
            // Get caller address
            let sender = get_caller_address();
            
            // Validate inputs
            assert(recipient.into() != 0, 'Invalid recipient address');
            assert(token.into() != 0, 'Invalid token address');
            
            // Convert separate low/high bits to u256 to avoid felt overflow
            let amount = u256 { 
                low: amount_low.try_into().unwrap(), 
                high: amount_high.try_into().unwrap() 
            };
            
            assert(amount > u256 { low: 0, high: 0 }, 'Amount must be greater than 0');
            assert(timelock > 0, 'Timelock must be greater than 0');
            
            // Get current timestamp
            let current_time = get_block_timestamp();
            
            // Get next HTLC ID
            let htlc_id = self.next_htlc_id.read();
            
            // Create HTLC
            let new_htlc = HTLC {
                sender,
                recipient,
                token,
                amount,
                hashlock,
                timelock,
                withdrawn: false,
                refunded: false,
                created_at: current_time,
            };
            
            // Store HTLC
            self.htlcs.write(htlc_id, new_htlc);
            
            // Increment next HTLC ID
            self.next_htlc_id.write(htlc_id + 1);
            
            // Transfer tokens from sender to contract
            let token_contract = IERC20Dispatcher { contract_address: token };
            let contract_address = get_contract_address();
            let transfer_success = token_contract.transferFrom(sender, contract_address, amount);
            assert(transfer_success, 'Token transfer failed');
            
            // Emit event
            self.emit(
                HTLCCreated {
                    htlc_id,
                    sender,
                    recipient,
                    token,
                    amount,
                    hashlock,
                    timelock,
                }
            );
            
            htlc_id
        }
        
        // Withdraw tokens using the secret
        fn withdraw(ref self: ContractState, htlc_id: felt252, secret: felt252) {
            // Get caller address
            let caller = get_caller_address();
            
            // Get HTLC
            let htlc = self.htlcs.read(htlc_id);
            
            // Check if HTLC exists (sender address will be zero if not)
            assert(htlc.sender.into() != 0, 'HTLC does not exist');
            
            // Check if caller is recipient
            assert(caller == htlc.recipient, 'Only recipient can withdraw');
            
            // Check if HTLC has not been withdrawn or refunded
            assert(!htlc.withdrawn, 'HTLC already withdrawn');
            assert(!htlc.refunded, 'HTLC already refunded');
            
            // Check if timelock has not expired
            let current_time = get_block_timestamp();
            assert(current_time <= htlc.created_at + htlc.timelock, 'Timelock expired');
            
            // Verify secret using keccak hash (compatible with Ethereum)
            // Convert secret to u256 for keccak hashing
            let mut data = ArrayTrait::new();
            // Use a safe conversion that won't overflow
            let secret_u256 = u256 { low: secret.try_into().unwrap(), high: 0 };
            data.append(secret_u256);
            let hash_result = keccak_u256s_be_inputs(data.span());
            let computed_hash = hash_result.low.try_into().unwrap();
            
            assert(computed_hash == htlc.hashlock, 'Invalid secret');
            
            // Mark HTLC as withdrawn
            let new_htlc = HTLC {
                sender: htlc.sender,
                recipient: htlc.recipient,
                token: htlc.token,
                amount: htlc.amount,
                hashlock: htlc.hashlock,
                timelock: htlc.timelock,
                withdrawn: true,
                refunded: false,
                created_at: htlc.created_at,
            };
            self.htlcs.write(htlc_id, new_htlc);
            
            // Transfer tokens to recipient
            let token_contract = IERC20Dispatcher { contract_address: htlc.token };
            let transfer_success = token_contract.transfer(htlc.recipient, htlc.amount);
            assert(transfer_success, 'Token transfer failed');
            
            // Emit event
            self.emit(HTLCWithdrawn { htlc_id, secret });
        }
        
        // Refund tokens after timelock expires
        fn refund(ref self: ContractState, htlc_id: felt252) {
            // Get caller address
            let caller = get_caller_address();
            
            // Get current timestamp
            let current_time = get_block_timestamp();
            
            // Get HTLC
            let htlc = self.htlcs.read(htlc_id);
            
            // Check if HTLC exists
            assert(htlc.sender.into() != 0, 'HTLC does not exist');
            
            // Check if caller is sender
            assert(caller == htlc.sender, 'Only sender can refund');
            
            // Check if HTLC has not been withdrawn or refunded
            assert(!htlc.withdrawn, 'HTLC already withdrawn');
            assert(!htlc.refunded, 'HTLC already refunded');
            
            // Check if timelock has expired
            assert(current_time > htlc.created_at + htlc.timelock, 'Timelock not expired');
            
            // Mark HTLC as refunded
            let new_htlc = HTLC {
                sender: htlc.sender,
                recipient: htlc.recipient,
                token: htlc.token,
                amount: htlc.amount,
                hashlock: htlc.hashlock,
                timelock: htlc.timelock,
                withdrawn: false,
                refunded: true,
                created_at: htlc.created_at,
            };
            self.htlcs.write(htlc_id, new_htlc);
            
            // Transfer tokens back to sender
            let token_contract = IERC20Dispatcher { contract_address: htlc.token };
            let transfer_success = token_contract.transfer(htlc.sender, htlc.amount);
            assert(transfer_success, 'Token transfer failed');
            
            // Emit event
            self.emit(HTLCRefunded { htlc_id });
        }
        
        // Get HTLC details
        fn get_htlc(self: @ContractState, htlc_id: felt252) -> HTLC {
            self.htlcs.read(htlc_id)
        }
        
        // Get token balance for any address
        fn get_balance(self: @ContractState, token_address: ContractAddress, user_address: ContractAddress) -> u256 {
            // Create token contract dispatcher
            let token = IERC20Dispatcher {
                contract_address: token_address,
            };
            
            // Call balanceOf function on the token contract
            token.balanceOf(user_address)
        }
        
        // Deposit funds directly into the contract
        fn deposit_funds(
            ref self: ContractState, 
            token: ContractAddress, 
            amount_low: felt252,
            amount_high: felt252
        ) -> bool {
            // Get caller address
            let sender = get_caller_address();
            
            // Validate inputs
            assert(token.into() != 0, 'Invalid token address');
            
            // Convert separate low/high bits to u256 to avoid felt overflow
            let amount = u256 { 
                low: amount_low.try_into().unwrap(), 
                high: amount_high.try_into().unwrap() 
            };
            
            assert(amount > u256 { low: 0, high: 0 }, 'Amount must be greater than 0');
            
            // Get current timestamp
            let current_time = get_block_timestamp();
            
            // Transfer tokens from sender to contract
            let token_contract = IERC20Dispatcher { contract_address: token };
            let contract_address = get_contract_address();
            let transfer_success = token_contract.transferFrom(sender, contract_address, amount);
            assert(transfer_success, 'Token transfer failed');
            
            // Emit deposit event
            self.emit(
                FundsDeposited {
                    sender,
                    token,
                    amount,
                    timestamp: current_time
                }
            );
            
            true
        }
    }
}