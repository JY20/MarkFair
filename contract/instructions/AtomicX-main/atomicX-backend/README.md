# 🌉 AtomicX Backend - EVM ↔ StarkNet Atomic Swap System

A complete, production-ready atomic swap implementation enabling trustless exchanges between EVM chains (Ethereum, Polygon, BSC, etc.) and StarkNet. Built with secure HTLC contracts for both chains.

## 🏗️ Architecture Overview

This system implements **Hash Time Locked Contracts (HTLCs)** on both chains to enable atomic swaps:

* **EVM Side**: Smart contracts for escrow functionality
* **StarkNet Side**: Cairo smart contracts with HTLC functionality
* **Atomic Guarantee**: Either both parties get their desired assets, or both get refunded

### 🔄 Supported Swap Directions

1. **EVM → StarkNet**: Trade ETH/ERC20 tokens for StarkNet assets
2. **StarkNet → EVM**: Trade StarkNet assets for ETH/ERC20 tokens

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 16+
node --version

# Git
git --version
```

### Environment Setup

Create `.env` file:

```
# EVM Configuration
PRIVATE_KEY=your_ethereum_private_key
SEPOLIA_RPC_URL=https://sepolia.drpc.org
ETHERSCAN_API_KEY=your_etherscan_key

# StarkNet Configuration
STARKNET_PRIVATE_KEY=your_starknet_private_key
STARKNET_ADDRESS=your_starknet_address
STARKNET_NETWORK=goerli-alpha
```

### Get Testnet Funds

* **Sepolia ETH**: [Sepolia Faucet](https://sepoliafaucet.com/)
* **StarkNet Goerli**: [StarkNet Faucet](https://faucet.goerli.starknet.io/)

## 💱 Swap Flows

### 🔵 EVM → StarkNet Flow

**Participants**: MAKER (provides ETH), TAKER (provides StarkNet assets)

```bash
# 1. MAKER creates order
npm run maker:create

# 2. TAKER fills order (creates StarkNet HTLC)
ORDER_ID=order_123 npm run taker:fill

# 3. MAKER creates EVM escrow
ORDER_ID=order_123 npm run maker:escrow

# 4. TAKER funds StarkNet HTLC
ORDER_ID=order_123 npm run taker:fund

# 5. MAKER claims StarkNet assets (reveals secret)
ORDER_ID=order_123 npm run maker:claim

# 6. TAKER claims ETH (using revealed secret)
ORDER_ID=order_123 npm run taker:claim
```

### 🔴 StarkNet → EVM Flow (Reverse)

**Participants**: MAKER (provides StarkNet assets), TAKER (provides ETH)

```bash
# 1. MAKER creates reverse order
npm run reverse:create

# 2. MAKER creates StarkNet HTLC
ORDER_ID=reverse_order_123 npm run reverse:maker:htlc

# 3. MAKER funds StarkNet HTLC
ORDER_ID=reverse_order_123 npm run reverse:maker:fund

# 4. TAKER creates EVM escrow
ORDER_ID=reverse_order_123 npm run reverse:taker:escrow

# 5. MAKER claims ETH (reveals secret)
ORDER_ID=reverse_order_123 npm run reverse:maker:claim

# 6. TAKER claims StarkNet assets (using revealed secret)
ORDER_ID=reverse_order_123 npm run reverse:taker:claim
```

## 🔐 Cryptographic Flow

### Secret & Hashlock Generation

```javascript
// 1. Generate random 32-byte secret
const secret = crypto.randomBytes(32);
const secretHex = "0x" + secret.toString("hex");

// 2. Create SHA-256 hashlock
const hashlock = ethers.sha256(secretHex);

// 3. Use in both EVM contracts and StarkNet HTLCs
```

### Atomic Swap Guarantee

1. **Setup Phase**: Both parties lock assets using same hashlock
2. **Claim Phase**: First claimer reveals secret, second uses revealed secret
3. **Safety**: If either fails, both get refunded after timelock

## 🛡️ Security Features

### Hash Time Locked Contracts (HTLCs)

* **Hashlock**: SHA-256 hash ensures atomic execution
* **Timelock**: Automatic refunds prevent fund loss
* **Script Verification**: Bitcoin Script validates all conditions

### Key Protections

* **No Counterparty Risk**: Trustless execution
* **Atomic Guarantee**: Both succeed or both fail
* **Replay Protection**: Each swap uses unique secret
* **Time Boundaries**: Configurable timelock periods 