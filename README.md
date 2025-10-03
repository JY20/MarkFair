# MarkFair

<p align="center">
  <img src="markfair_logo.png" alt="MarkFair Logo" width="500"/>
</p>

MarkFair is a marketing hub built for the Web3 era. Startups and companies are always looking for ways to get the word out, and KOLs (Key Opinion Leaders) and online creators are always looking for new opportunities. MarkFair connects the two worlds.

## Overview

On MarkFair, brands can post campaigns or specific tasks, whether it's promoting a launch, creating content, or building community hype, and KOLs can pick them up, get the job done, and earn crypto directly. No endless DMs, no messy negotiations, just a clean platform where both sides know what they're getting.

### Key Features

- **Smart Contract Escrow**: Secure payment system using Starknet blockchain technology
- **Campaign Management**: Create, track, and manage marketing campaigns in one place
- **KOL Discovery**: Find the right influencers for your specific needs and target audience
- **Performance Analytics**: Track campaign effectiveness with detailed metrics
- **Reputation System**: Built-in rating system for both brands and KOLs
- **Direct Crypto Payments**: Fast and secure payments without intermediaries

## What Makes Us Different

What makes MarkFair stand out is the "Fair" part. Everything runs through smart contracts and escrow, so when a KOL finishes their task, payment is locked in and automatically released. Companies get the results they need, KOLs get rewarded instantly, and the whole process stays transparent, efficient, and trustless.

### Technical Advantages

- **Trustless Execution**: Smart contracts ensure all parties fulfill their obligations
- **Low Fees**: Minimal platform fees compared to traditional marketing agencies
- **Transparent Process**: All transactions and campaign details are verifiable on-chain
- **Cross-Chain Compatibility**: Support for multiple blockchain ecosystems (planned)
- **Decentralized Governance**: Community-driven platform development (roadmap)

## Vision

The bigger picture is simple. Web3 projects, especially early-stage startups, desperately need marketing to survive. MarkFair makes sure they have a one-stop shop to find the right voices to spread their message. For KOLs, it means a steady flow of jobs, rewards, and time saved by having everything in one place.

### Roadmap

- **Q4 2025**: Launch on Starknet Mainnet with core escrow functionality
- **Q1 2026**: Add multi-chain support and expanded KOL verification features
- **Q2 2026**: Implement DAO governance for platform development decisions
- **Q3 2026**: Launch MarkFair token with utility and governance functions
- **Q4 2026**: Develop advanced analytics and AI-powered campaign matching

## Project Structure

- `frontend/` - Frontend application code
  - React-based web application with Web3 integration
  - Responsive design for desktop and mobile users
  - Integration with Starknet wallet providers
  
- `backend/` - Backend server and API code
  - FastAPI-based REST API service
  - PostgreSQL database for user and campaign data
  - Authentication via Clerk and wallet signatures
  
- `contract/` - Blockchain smart contracts, scripts, and documentation
  - `src/` - Cairo smart contract source code
  - `scripts/` - JavaScript tools for Merkle tree and signatures
  - `strk-merkle-tree/` - Starknet Merkle tree implementation library
  - `instructions/` - Complete documentation and deployment guides
  - `target/` - Compiled contract artifacts

## Smart Contract Status

✅ **Deployed on Starknet Sepolia**: Ready for integration  
✅ **Fully Tested**: Merkle tree signatures verified  
✅ **Production Ready**: Complete documentation available

### Key Contracts

- **KolEscrow**: `0x0542602e67fee6bfbea8368b83f1933ede566c94ef37624bec6a60c7831d2115`
- **MarkFair Token**: `0x015d942cee86bb00aee0b17aeb6dddb8de07074284a365505960f244ffe44a95`

For detailed integration guides, see `contract/instructions/`.

## Getting Started

### Prerequisites

- Node.js 18+ for frontend and scripts
- Python 3.9+ for backend
- Docker for local development
- Starknet wallet (Argent X or Braavos recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/markfair.git
   cd markfair
   ```

2. Set up each component:
   - Follow instructions in `frontend/README.md` for frontend setup
   - Follow instructions in `backend/README.md` for backend setup
   - Follow instructions in `contract/README.md` for contract interaction

### Development Environment

The project uses a containerized development environment for consistency:

```bash
docker-compose up -d
```

This will start the frontend, backend, and database services.

## Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
