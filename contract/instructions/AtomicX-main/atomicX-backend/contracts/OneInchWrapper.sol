// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OneInchWrapper
 * @dev Wrapper contract for 1inch Limit Order Protocol integration
 * This contract handles the integration with 1inch for atomic swaps
 */
contract OneInchWrapper is ReentrancyGuard, Ownable {
    
    // Events
    event LimitOrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        address makerAsset,
        address takerAsset,
        uint256 makerAmount,
        uint256 takerAmount,
        uint256 deadline
    );
    
    event LimitOrderFilled(
        bytes32 indexed orderHash,
        address indexed taker,
        uint256 makerAmount,
        uint256 takerAmount
    );
    
    event LimitOrderCancelled(bytes32 indexed orderHash, address indexed maker);
    
    // Structs
    struct LimitOrder {
        address makerAsset;
        address takerAsset;
        uint256 makerAmount;
        uint256 takerAmount;
        address maker;
        uint256 salt;
        uint256 deadline;
    }
    
    // State variables
    mapping(bytes32 => bool) public filledOrders;
    mapping(bytes32 => bool) public cancelledOrders;
    mapping(address => uint256) public nonces;
    
    // Constants
    uint256 public constant MIN_ORDER_AMOUNT = 1;
    uint256 public constant MAX_ORDER_AMOUNT = type(uint256).max;
    
    // 1inch integration addresses (will be set after deployment)
    address public oneInchRouter;
    address public oneInchLimitOrderProtocol;
    
    constructor() {
        // Initialize with default values
        // These will be updated via setOneInchAddresses
    }
    
    /**
     * @dev Set 1inch contract addresses
     * @param _router 1inch router address
     * @param _limitOrderProtocol 1inch limit order protocol address
     */
    function setOneInchAddresses(address _router, address _limitOrderProtocol) external onlyOwner {
        oneInchRouter = _router;
        oneInchLimitOrderProtocol = _limitOrderProtocol;
    }
    
    /**
     * @dev Creates a new limit order compatible with 1inch protocol
     * @param order The order parameters
     */
    function createLimitOrder(LimitOrder calldata order) 
        external 
        payable
        nonReentrant 
    {
        require(order.maker != address(0), "Invalid maker address");
        require(order.makerAmount >= MIN_ORDER_AMOUNT, "Amount too small");
        require(order.takerAmount >= MIN_ORDER_AMOUNT, "Amount too small");
        require(order.deadline > block.timestamp, "Order expired");
        
        bytes32 orderHash = getOrderHash(order);
        require(!filledOrders[orderHash], "Order already filled");
        require(!cancelledOrders[orderHash], "Order cancelled");
        
        // Transfer maker assets
        if (order.makerAsset == address(0)) {
            // ETH
            require(msg.value == order.makerAmount, "Incorrect ETH amount");
        } else {
            // ERC20
            IERC20(order.makerAsset).transferFrom(
                order.maker,
                address(this),
                order.makerAmount
            );
        }
        
        emit LimitOrderCreated(
            orderHash,
            order.maker,
            order.makerAsset,
            order.takerAsset,
            order.makerAmount,
            order.takerAmount,
            order.salt
        );
    }
    
    /**
     * @dev Fills a limit order
     * @param order The order to fill
     */
    function fillLimitOrder(LimitOrder calldata order) 
        external 
        payable
        nonReentrant 
    {
        bytes32 orderHash = getOrderHash(order);
        require(!filledOrders[orderHash], "Order already filled");
        require(!cancelledOrders[orderHash], "Order cancelled");
        require(order.deadline > block.timestamp, "Order expired");
        
        filledOrders[orderHash] = true;
        
        // Transfer assets
        if (order.makerAsset == address(0)) {
            // ETH to taker
            payable(msg.sender).transfer(order.makerAmount);
        } else {
            // ERC20 to taker
            IERC20(order.makerAsset).transfer(msg.sender, order.makerAmount);
        }
        
        if (order.takerAsset == address(0)) {
            // ETH from taker
            require(msg.value == order.takerAmount, "Incorrect ETH amount");
            payable(order.maker).transfer(order.takerAmount);
        } else {
            // ERC20 from taker
            IERC20(order.takerAsset).transferFrom(
                msg.sender,
                order.maker,
                order.takerAmount
            );
        }
        
        emit LimitOrderFilled(
            orderHash,
            msg.sender,
            order.makerAmount,
            order.takerAmount
        );
    }
    
    /**
     * @dev Cancels an order (only by maker)
     * @param order The order to cancel
     */
    function cancelLimitOrder(LimitOrder calldata order) external nonReentrant {
        require(msg.sender == order.maker, "Only maker can cancel");
        
        bytes32 orderHash = getOrderHash(order);
        require(!filledOrders[orderHash], "Order already filled");
        require(!cancelledOrders[orderHash], "Order already cancelled");
        
        cancelledOrders[orderHash] = true;
        
        // Return maker assets
        if (order.makerAsset == address(0)) {
            payable(order.maker).transfer(order.makerAmount);
        } else {
            IERC20(order.makerAsset).transfer(order.maker, order.makerAmount);
        }
        
        emit LimitOrderCancelled(orderHash, order.maker);
    }
    
    /**
     * @dev Gets the hash of an order
     * @param order The order
     * @return The order hash
     */
    function getOrderHash(LimitOrder calldata order) public pure returns (bytes32) {
        return keccak256(abi.encode(
            order.makerAsset,
            order.takerAsset,
            order.makerAmount,
            order.takerAmount,
            order.maker,
            order.salt,
            order.deadline
        ));
    }
    
    /**
     * @dev Checks if an order is valid
     * @param order The order to check
     * @return True if valid
     */
    function isValidOrder(LimitOrder calldata order) external view returns (bool) {
        bytes32 orderHash = getOrderHash(order);
        return !filledOrders[orderHash] && 
               !cancelledOrders[orderHash] && 
               order.deadline > block.timestamp;
    }
    
    /**
     * @dev Emergency withdraw function for stuck tokens
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
     * @dev Get next nonce for a user
     * @param user User address
     * @return Next nonce
     */
    function getNextNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
    
    /**
     * @dev Increment nonce for a user
     * @param user User address
     */
    function incrementNonce(address user) external {
        nonces[user]++;
    }
} 