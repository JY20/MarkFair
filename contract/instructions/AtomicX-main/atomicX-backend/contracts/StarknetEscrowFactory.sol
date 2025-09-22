// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title StarknetEscrowFactory
 * @dev Factory contract for creating Starknet atomic swap escrow contracts
 */
contract StarknetEscrowFactory {
    // Events
    event EscrowCreated(address indexed maker, address indexed taker, address escrow, bytes32 orderHash);
    
    // Immutables struct for escrow contracts
    struct Immutables {
        bytes32 orderHash;
        bytes32 hashlock;
        uint256 maker;
        uint256 taker;
        uint256 token;
        uint256 amount;
        uint256 safetyDeposit;
        uint256 timelocks;
    }
    
    /**
     * @dev Creates a source escrow contract (EVM→Starknet)
     * @param immutables The immutable parameters for the escrow
     * @return The address of the created escrow contract
     */
    function createSrcEscrow(Immutables memory immutables) external payable returns (address) {
        // Create escrow contract
        address escrow = address(new StarknetEscrowSrc{value: msg.value}(immutables));
        
        // Emit event
        emit EscrowCreated(
            address(uint160(immutables.maker)),
            address(uint160(immutables.taker)),
            escrow,
            immutables.orderHash
        );
        
        return escrow;
    }
    
    /**
     * @dev Creates a destination escrow contract (Starknet→EVM)
     * @param immutables The immutable parameters for the escrow
     * @return The address of the created escrow contract
     */
    function createDstEscrow(Immutables memory immutables) external payable returns (address) {
        // Create escrow contract
        address escrow = address(new StarknetEscrowDst{value: msg.value}(immutables));
        
        // Emit event
        emit EscrowCreated(
            address(uint160(immutables.maker)),
            address(uint160(immutables.taker)),
            escrow,
            immutables.orderHash
        );
        
        return escrow;
    }
}

/**
 * @title StarknetEscrowSrc
 * @dev Source escrow contract for EVM→Starknet atomic swaps
 */
contract StarknetEscrowSrc {
    // Immutable parameters
    bytes32 public immutable orderHash;
    bytes32 public immutable hashlock;
    address public immutable maker;
    address public immutable taker;
    address public immutable token;
    uint256 public immutable amount;
    uint256 public immutable safetyDeposit;
    uint256 public immutable timelocks;
    
    // Timestamps
    uint256 public createdAt;
    
    // Constructor
    constructor(StarknetEscrowFactory.Immutables memory immutables) payable {
        orderHash = immutables.orderHash;
        hashlock = immutables.hashlock;
        maker = address(uint160(immutables.maker));
        taker = address(uint160(immutables.taker));
        token = address(uint160(immutables.token));
        amount = immutables.amount;
        safetyDeposit = immutables.safetyDeposit;
        timelocks = immutables.timelocks;
        createdAt = block.timestamp;
        
        // Validate parameters
        require(maker != address(0), "Invalid maker address");
        require(taker != address(0), "Invalid taker address");
        
        // Check if ETH amount is correct
        if (token == address(0)) {
            require(msg.value == amount, "Invalid ETH amount");
        }
    }
    
    /**
     * @dev Withdraw funds using the secret
     * @param secret The secret that hashes to the hashlock
     */
    function withdraw(bytes32 secret) external {
        // Verify secret
        require(sha256(abi.encodePacked(secret)) == hashlock, "Invalid secret");
        
        // Check if caller is taker
        require(msg.sender == taker, "Only taker can withdraw");
        
        // Transfer funds to taker
        if (token == address(0)) {
            payable(taker).transfer(address(this).balance);
        } else {
            // In a real implementation, transfer ERC20 tokens
        }
    }
    
    /**
     * @dev Cancel the escrow after timelock expires
     */
    function cancel() external {
        // Get withdrawal and cancellation periods
        uint256 withdrawalPeriod = timelocks & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        uint256 cancellationPeriod = timelocks >> 128;
        
        // Check if cancellation period has passed
        require(block.timestamp >= createdAt + withdrawalPeriod + cancellationPeriod, "Cancellation period not passed");
        
        // Check if caller is maker
        require(msg.sender == maker, "Only maker can cancel");
        
        // Transfer funds back to maker
        if (token == address(0)) {
            payable(maker).transfer(address(this).balance);
        } else {
            // In a real implementation, transfer ERC20 tokens
        }
    }
}

/**
 * @title StarknetEscrowDst
 * @dev Destination escrow contract for Starknet→EVM atomic swaps
 */
contract StarknetEscrowDst {
    // Immutable parameters
    bytes32 public immutable orderHash;
    bytes32 public immutable hashlock;
    address public immutable maker;
    address public immutable taker;
    address public immutable token;
    uint256 public immutable amount;
    uint256 public immutable safetyDeposit;
    uint256 public immutable timelocks;
    
    // Timestamps
    uint256 public createdAt;
    
    // Constructor
    constructor(StarknetEscrowFactory.Immutables memory immutables) payable {
        orderHash = immutables.orderHash;
        hashlock = immutables.hashlock;
        maker = address(uint160(immutables.maker));
        taker = address(uint160(immutables.taker));
        token = address(uint160(immutables.token));
        amount = immutables.amount;
        safetyDeposit = immutables.safetyDeposit;
        timelocks = immutables.timelocks;
        createdAt = block.timestamp;
        
        // Validate parameters
        require(maker != address(0), "Invalid maker address");
        require(taker != address(0), "Invalid taker address");
        
        // Check if ETH amount is correct
        if (token == address(0)) {
            require(msg.value == amount, "Invalid ETH amount");
        }
    }
    
    /**
     * @dev Withdraw funds using the secret
     * @param secret The secret that hashes to the hashlock
     */
    function withdraw(bytes32 secret) external {
        // Verify secret
        require(sha256(abi.encodePacked(secret)) == hashlock, "Invalid secret");
        
        // Check if caller is maker
        require(msg.sender == maker, "Only maker can withdraw");
        
        // Transfer funds to maker
        if (token == address(0)) {
            payable(maker).transfer(address(this).balance);
        } else {
            // In a real implementation, transfer ERC20 tokens
        }
    }
    
    /**
     * @dev Cancel the escrow after timelock expires
     */
    function cancel() external {
        // Get withdrawal and cancellation periods
        uint256 withdrawalPeriod = timelocks & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        uint256 cancellationPeriod = timelocks >> 128;
        
        // Check if cancellation period has passed
        require(block.timestamp >= createdAt + withdrawalPeriod + cancellationPeriod, "Cancellation period not passed");
        
        // Check if caller is taker
        require(msg.sender == taker, "Only taker can cancel");
        
        // Transfer funds back to taker
        if (token == address(0)) {
            payable(taker).transfer(address(this).balance);
        } else {
            // In a real implementation, transfer ERC20 tokens
        }
    }
} 