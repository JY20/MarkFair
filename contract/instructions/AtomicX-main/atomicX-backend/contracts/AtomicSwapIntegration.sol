// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./StarknetEscrowFactory.sol";
import "./OneInchWrapper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AtomicSwapIntegration
 * @dev Integration contract that combines HTLC atomic swaps with 1inch Limit Orders
 */
contract AtomicSwapIntegration is ReentrancyGuard, Ownable {
    
    // Contract addresses
    StarknetEscrowFactory public immutable htlcFactory;
    OneInchWrapper public immutable oneInchWrapper;
    
    // Events
    event AtomicSwapWithLimitOrder(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        address escrow,
        uint256 amount,
        bool isLimitOrder
    );
    
    event LimitOrderFilledWithHTLC(
        bytes32 indexed orderHash,
        address indexed taker,
        address escrow,
        uint256 amount
    );
    
    // Constructor
    constructor(address _htlcFactory, address _oneInchWrapper) {
        htlcFactory = StarknetEscrowFactory(_htlcFactory);
        oneInchWrapper = OneInchWrapper(_oneInchWrapper);
    }
    
    /**
     * @dev Create an atomic swap with optional limit order
     * @param immutables HTLC parameters
     * @param createLimitOrder Whether to also create a 1inch limit order
     * @param limitOrderData Limit order data (if createLimitOrder is true)
     */
    function createAtomicSwapWithLimitOrder(
        StarknetEscrowFactory.Immutables memory immutables,
        bool createLimitOrder,
        OneInchWrapper.LimitOrder calldata limitOrderData
    ) external payable nonReentrant {
        // Create HTLC escrow
        address escrow = htlcFactory.createSrcEscrow{value: msg.value}(immutables);
        
        // If limit order is requested, create it
        if (createLimitOrder) {
            // Create the limit order through 1inch wrapper
            oneInchWrapper.createLimitOrder{value: limitOrderData.makerAmount}(limitOrderData);
            
            emit AtomicSwapWithLimitOrder(
                immutables.orderHash,
                address(uint160(immutables.maker)),
                address(uint160(immutables.taker)),
                escrow,
                immutables.amount,
                true
            );
        } else {
            emit AtomicSwapWithLimitOrder(
                immutables.orderHash,
                address(uint160(immutables.maker)),
                address(uint160(immutables.taker)),
                escrow,
                immutables.amount,
                false
            );
        }
    }
    
    /**
     * @dev Fill a limit order and create HTLC escrow
     * @param limitOrderData The limit order to fill
     * @param immutables HTLC parameters for the atomic swap
     */
    function fillLimitOrderWithHTLC(
        OneInchWrapper.LimitOrder calldata limitOrderData,
        StarknetEscrowFactory.Immutables memory immutables
    ) external payable nonReentrant {
        // Fill the limit order
        oneInchWrapper.fillLimitOrder{value: limitOrderData.takerAmount}(limitOrderData);
        
        // Create HTLC escrow for the atomic swap
        address escrow = htlcFactory.createSrcEscrow{value: msg.value}(immutables);
        
        emit LimitOrderFilledWithHTLC(
            limitOrderData.makerAsset == address(0) ? 
            keccak256(abi.encodePacked(limitOrderData.makerAsset, limitOrderData.takerAsset, limitOrderData.makerAmount, limitOrderData.takerAmount, limitOrderData.maker, limitOrderData.salt, limitOrderData.deadline)) :
            immutables.orderHash,
            msg.sender,
            escrow,
            immutables.amount
        );
    }
    
    /**
     * @dev Check if a limit order is valid and can be filled
     * @param limitOrderData The limit order to check
     * @return True if valid
     */
    function isLimitOrderValid(OneInchWrapper.LimitOrder calldata limitOrderData) external view returns (bool) {
        return oneInchWrapper.isValidOrder(limitOrderData);
    }
    
    /**
     * @dev Get the hash of a limit order
     * @param limitOrderData The limit order
     * @return The order hash
     */
    function getLimitOrderHash(OneInchWrapper.LimitOrder calldata limitOrderData) external view returns (bytes32) {
        return oneInchWrapper.getOrderHash(limitOrderData);
    }
    
    /**
     * @dev Emergency withdraw function
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }
    
    /**
     * @dev Get contract addresses
     * @return HTLC factory address
     * @return 1inch wrapper address
     */
    function getContractAddresses() external view returns (address, address) {
        return (address(htlcFactory), address(oneInchWrapper));
    }
} 