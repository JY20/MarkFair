# SPDX-License-Identifier: MIT

%lang starknet
%builtins pedersen range_check ecdsa

from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.math import assert_lt, assert_not_zero
from starkware.starknet.common.syscalls import get_caller_address, get_block_timestamp
from starkware.cairo.common.uint256 import Uint256, uint256_lt

# HTLC struct
struct HTLC {
    sender: felt,
    recipient: felt,
    token: felt,
    amount: Uint256,
    hashlock: felt,
    timelock: felt,
    withdrawn: felt,
    refunded: felt,
    created_at: felt,
}

# Storage
@storage_var
func htlcs(htlc_id: felt) -> (htlc: HTLC) {
}

@storage_var
func next_htlc_id() -> (id: felt) {
}

# Events
@event
func HTLCCreated(
    htlc_id: felt,
    sender: felt,
    recipient: felt,
    token: felt,
    amount: Uint256,
    hashlock: felt,
    timelock: felt
) {
}

@event
func HTLCWithdrawn(htlc_id: felt, secret: felt) {
}

@event
func HTLCRefunded(htlc_id: felt) {
}

# Constructor
@constructor
func constructor() {
    next_htlc_id.write(1);
    return ();
}

# Create a new HTLC
@external
func create_htlc(
    hashlock: felt, recipient: felt, token: felt, amount: Uint256, timelock: felt
) -> (htlc_id: felt) {
    alloc_locals;
    
    # Get caller address
    let (sender) = get_caller_address();
    
    # Get current timestamp
    let (current_time) = get_block_timestamp();
    
    # Get next HTLC ID
    let (htlc_id) = next_htlc_id.read();
    
    # Create HTLC
    let htlc = HTLC(
        sender=sender,
        recipient=recipient,
        token=token,
        amount=amount,
        hashlock=hashlock,
        timelock=timelock,
        withdrawn=0,
        refunded=0,
        created_at=current_time,
    );
    
    # Store HTLC
    htlcs.write(htlc_id, htlc);
    
    # Increment next HTLC ID
    next_htlc_id.write(htlc_id + 1);
    
    # Transfer tokens from sender to contract
    # Note: In a real implementation, we would call the ERC20 token contract here
    
    # Emit event
    HTLCCreated.emit(htlc_id, sender, recipient, token, amount, hashlock, timelock);
    
    return (htlc_id=htlc_id);
}

# Withdraw from HTLC using secret
@external
func withdraw(htlc_id: felt, secret: felt) {
    alloc_locals;
    
    # Get caller address
    let (caller) = get_caller_address();
    
    # Get HTLC
    let (htlc) = htlcs.read(htlc_id);
    
    # Check if HTLC exists
    assert_not_zero(htlc.sender);
    
    # Check if caller is recipient
    assert caller = htlc.recipient;
    
    # Check if HTLC has not been withdrawn or refunded
    assert htlc.withdrawn = 0;
    assert htlc.refunded = 0;
    
    # Verify secret
    let (secret_hash) = hash2{hash_ptr=pedersen_ptr}(secret, 0);
    assert secret_hash = htlc.hashlock;
    
    # Mark HTLC as withdrawn
    let updated_htlc = HTLC(
        sender=htlc.sender,
        recipient=htlc.recipient,
        token=htlc.token,
        amount=htlc.amount,
        hashlock=htlc.hashlock,
        timelock=htlc.timelock,
        withdrawn=1,
        refunded=0,
        created_at=htlc.created_at,
    );
    htlcs.write(htlc_id, updated_htlc);
    
    # Transfer tokens to recipient
    # Note: In a real implementation, we would call the ERC20 token contract here
    
    # Emit event
    HTLCWithdrawn.emit(htlc_id, secret);
    
    return ();
}

# Refund HTLC after timelock
@external
func refund(htlc_id: felt) {
    alloc_locals;
    
    # Get caller address
    let (caller) = get_caller_address();
    
    # Get current timestamp
    let (current_time) = get_block_timestamp();
    
    # Get HTLC
    let (htlc) = htlcs.read(htlc_id);
    
    # Check if HTLC exists
    assert_not_zero(htlc.sender);
    
    # Check if caller is sender
    assert caller = htlc.sender;
    
    # Check if HTLC has not been withdrawn or refunded
    assert htlc.withdrawn = 0;
    assert htlc.refunded = 0;
    
    # Check if timelock has expired
    assert_lt(htlc.timelock + htlc.created_at, current_time);
    
    # Mark HTLC as refunded
    let updated_htlc = HTLC(
        sender=htlc.sender,
        recipient=htlc.recipient,
        token=htlc.token,
        amount=htlc.amount,
        hashlock=htlc.hashlock,
        timelock=htlc.timelock,
        withdrawn=0,
        refunded=1,
        created_at=htlc.created_at,
    );
    htlcs.write(htlc_id, updated_htlc);
    
    # Transfer tokens back to sender
    # Note: In a real implementation, we would call the ERC20 token contract here
    
    # Emit event
    HTLCRefunded.emit(htlc_id);
    
    return ();
}

# Get HTLC details
@view
func get_htlc(htlc_id: felt) -> (
    sender: felt,
    recipient: felt,
    token: felt,
    amount: Uint256,
    hashlock: felt,
    timelock: felt,
    withdrawn: felt,
    refunded: felt,
    created_at: felt
) {
    let (htlc) = htlcs.read(htlc_id);
    
    return (
        sender=htlc.sender,
        recipient=htlc.recipient,
        token=htlc.token,
        amount=htlc.amount,
        hashlock=htlc.hashlock,
        timelock=htlc.timelock,
        withdrawn=htlc.withdrawn,
        refunded=htlc.refunded,
        created_at=htlc.created_at,
    );
} 