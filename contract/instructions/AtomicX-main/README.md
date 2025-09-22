# 🚀 AtomicX : EVM ↔ Starknet Atomic Swap Aggregator

AtomicX is a powerful cross-chain platform that enables atomic swaps between Ethereum and Starknet networks using Hash Time Locked Contracts (HTLCs). The platform provides a secure, trustless solution for exchanging assets across different blockchains without intermediaries.

### Key Features

- **Cross-Chain Atomic Swaps**: Secure asset exchanges between Ethereum and Starknet
- **HTLC Implementation**: Time-locked contracts ensuring swap atomicity
- **Trustless Protocol**: No intermediaries or central authorities required
- **Modern Web Interface**: Intuitive React-based UI for seamless user experience
- **Wallet Integration**: Support for Ethereum and Starknet wallets
- **STRK Token Claims**: Support for claiming STRK tokens after confirming transactions

## 🏗️ Architecture Overview
This system implements **Hash Time Locked Contracts (HTLCs)** on both chains to enable atomic swaps:

- **Ethereum Side**: Smart contracts based on proven escrow system with StarknetEscrowFactory
- **Starknet Side**: Cairo-based HTLC contracts with native Starknet integration
- **Atomic Guarantee**: Either both parties get their desired assets, or both get refunded
- **Real-time UI**: React-based interface with live balance checking and transaction status

### 🔄 Supported Swap Directions

1. **Ethereum → Starknet**: Trade ETH/ERC20 tokens for STRK tokens
2. **Starknet → Ethereum**: Trade STRK tokens for ETH/ERC20 tokens

## 📊 Deployed Contracts

### Ethereum (Sepolia)
- **StarknetEscrowFactory**: `0x53195abE02b3fc143D325c29F6EA2c963C8e9fc6`
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x53195abe02b3fc143d325c29f6ea2c963c8e9fc6)
- **OneInchWrapper**: `0x5633F8a3FeFF2E8F615CbB17CC29946a51BaEEf9`
- **1inch Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x5633f8a3feff2e8f615cbb17cc29946a51baeef9)

### Starknet (Sepolia)
- **StarknetHTLC**: `0x028cd39a0ba1144339b6d095e6323b994ed836d92dc160cb36150bf84724317d`
- **Class Hash**: `0x0155ab7496dede9306cac15b61c76346db5d30ead2d7b70e55877b679fec5bea

## 💱 Swap Flows

### 🔵 Ethereum → Starknet Flow

**Participants**: MAKER (provides ETH), TAKER (provides STRK)

**Default Swap**: 0.01 ETH ↔ 2,600 STRK

```bash
# 1. MAKER creates order
npm run maker:create

# 2. TAKER fills order (creates Starknet HTLC)
npm run taker:fill

# 3. MAKER creates Ethereum escrow
 npm run maker:escrow

# 4. TAKER funds Starknet HTLC
 npm run taker:fund

# 5. MAKER claims STRK (reveals secret)
npm run maker:claim

# 6. TAKER claims ETH (using revealed secret)
npm run taker:claim
```

### 🔴 Starknet → Ethereum Flow (Reverse)

**Participants**: MAKER (provides STRK), TAKER (provides ETH)

```bash
# 1. MAKER creates reverse order
npm run reverse:create

# 2. MAKER creates Starknet HTLC
npm run reverse:maker:htlc

# 3. MAKER funds Starknet HTLC
 npm run reverse:maker:fund

# 4. TAKER creates Ethereum escrow
npm run reverse:taker:escrow

# 5. MAKER claims ETH (reveals secret)
npm run reverse:maker:claim

# 6. TAKER claims STRK (using revealed secret)
npm run reverse:taker:claim
```

## 📄 Smart Contract Details

### StarknetEscrowFactory
```solidity
// Create source escrow (ETH→Starknet)
function createSrcEscrow(Immutables memory immutables) 
    external payable returns (address)

// Create destination escrow (Starknet→ETH)  
function createDstEscrow(Immutables memory immutables)
    external payable returns (address)
```

### Immutables Structure
```solidity
struct Immutables {
    bytes32 orderHash;    // Unique order identifier
    bytes32 hashlock;     // SHA-256 hash of secret
    uint256 maker;        // Maker address as uint256
    uint256 taker;        // Taker address as uint256
    uint256 token;        // Token address (0 = ETH)
    uint256 amount;       // Amount in wei
    uint256 safetyDeposit;// Safety deposit
    uint256 timelocks;    // Packed timelock data
}
```

### Starknet HTLC Contract
```cairo
#[starknet::interface]
pub trait IHTLC<TContractState> {
    fn create_htlc(
        ref self: TContractState,
        hashlock: felt252,
        recipient: ContractAddress,
        token: ContractAddress,
        amount_low: felt252,
        amount_high: felt252,
        timelock: u64
    ) -> felt252;
    
    fn withdraw(ref self: TContractState, htlc_id: felt252, secret: felt252);
    
    fn refund(ref self: TContractState, htlc_id: felt252);
}
```


## 🏗️ Project Structure

```
AtomicX/
├── atomicX-app/           # React frontend application with real-time UI
│   ├── src/components/    # SwapPage, WalletConnect, etc.
│   ├── src/contexts/      # WalletContext with HTLC functions
│   └── server/           # Express.js server for swap tracking
├── atomicX_eth_contract/  # Ethereum smart contracts
├── atomicX_strk_contract/ # Starknet Cairo contracts
└── atomicX-backend/       # Testing & integration backend
```

### Environment Setup
Create `.env` file:
```bash
# Ethereum Configuration
PRIVATE_KEY=your_ethereum_private_key
SEPOLIA_RPC_URL=https://sepolia.drpc.org
ETHERSCAN_API_KEY=your_etherscan_key

# Starknet Configuration
STARKNET_PRIVATE_KEY=your_starknet_private_key
STARKNET_RPC_URL=https://alpha-sepolia.starknet.io
```

### Get Testnet Funds
- **Sepolia ETH**: [Sepolia Faucet](https://sepoliafaucet.com/)
- **Starknet ETH**: [Starknet Faucet](https://faucet.goerli.starknet.io/)
## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask or compatible Ethereum wallet
- ArgentX or compatible Starknet wallet

## 🔐 Cryptographic Flow

### Secret & Hashlock Generation
```javascript
// 1. Generate random 32-byte secret
const secret = crypto.randomBytes(32);
const secretHex = "0x" + secret.toString("hex");

// 2. Create SHA-256 hashlock (Ethereum) or Poseidon hash (Starknet)
const hashlock = ethers.sha256(secretHex);

// 3. Use in both Ethereum contracts and Starknet HTLCs
```

## 🚀 Development Setup

 Clone the repository:
```bash
git clone https://github.com/JY20/AtomicX.git
cd AtomicX
npm install 
```

### Frontend Application
```bash
cd atomicX-app
npm install
npm start
```

### Backend Testing
```bash
cd atomicX-backend
npm install
npm run build
npm run init
```

### Contract Deployment
```bash
# Ethereum contracts
cd atomicX_eth_contract
npx hardhat run deploy-ethereum.ts --network sepolia

# Starknet contracts
cd atomicX_strk_contract
scarb build
starkli deploy target/dev/quantmart_contract_StarknetHTLC.contract_class.json
```



# Run various testing scenarios
npm run maker:create     # Create new swap order
npm run maker:escrow     # Create Ethereum escrow
npm run taker:fund       # Fund Starknet HTLC
npm run maker:claim      # Claim on Starknet
npm run taker:claim      # Claim on Ethereum
```

## Development Workflow

### Complete Atomic Swap Testing

1. **Setup**: Configure wallets and network connections
2. **Create Order**: Initialize swap parameters using backend
3. **Ethereum Escrow**: Deploy HTLC on Ethereum
4. **Starknet Funding**: Fund corresponding HTLC on Starknet
5. **Claim Phase**: Execute claims on both networks
6. **Verification**: Confirm successful asset transfer



## Recent Updates

- Added STRK token claim functionality after confirming transactions
- Reduced timelock period from 1 hour to 10 seconds for faster testing
- Updated contract interfaces to support token operations
- Added helper functions for formatting claim data
- Improved error handling and mock responses for development

## License

Copyright © 2025 AtomicX. All rights reserved.
