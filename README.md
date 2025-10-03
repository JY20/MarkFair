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

### Frontend Application Features

#### 🔐 Authentication & Role Management
- Secure authentication system with Clerk integration
- Brand/KOL role selection and management
- User profile and settings management

#### 🌐 Blockchain Integration
- Starknet wallet connection (Argent X, Braavos support)
- Smart contract interaction for payments and escrow
- Network switching between testnet and mainnet

#### 📊 Task Management System
- **Brand Features**:
  - Create and publish marketing tasks
  - Track task progress and submissions
  - Manage payments and escrow releases
  - View KOL applications and profiles
- **KOL Features**:
  - Browse task marketplace with filtering
  - Apply for relevant tasks
  - Submit completed work and claim payments
  - Track earnings and task history

#### 🎥 Social Media Integration
- YouTube account connection and verification
- Channel analytics and subscriber data
- Content creation and submission tools

#### 💼 Dashboard & Analytics
- Personal data overview and statistics
- Earnings tracking and payment history
- Task performance metrics
- Campaign ROI analysis

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
  - **Framework**: React 18 + TypeScript with Vite build tool
  - **Styling**: Tailwind CSS with responsive design
  - **Authentication**: Clerk integration with role-based access
  - **Blockchain**: Starknet React + get-starknet wallet integration
  - **Features**: Task management, KOL marketplace, dashboard analytics
  - **Animation**: Framer Motion for smooth user interactions
  
- `backend/` - Backend server and API code
  - **Framework**: FastAPI-based REST API service
  - **Database**: PostgreSQL for user and campaign data
  - **Authentication**: Clerk and wallet signature verification
  - **Features**: Campaign management, payment processing, analytics
  
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

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Authentication**: Clerk Authentication
- **Blockchain**: Starknet React + get-starknet
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: Clerk + wallet signatures
- **API**: RESTful API design

### Blockchain
- **Network**: Starknet
- **Smart Contracts**: Cairo
- **Wallet Integration**: Argent X, Braavos
- **Token Standard**: ERC-20 compatible

## 🌐 Live Application

**Production Frontend:** [https://www.markfair.xyz/](https://www.markfair.xyz/)  
**Production Backend API:** [https://markfair-api-hxfbajeza6hyfhdh.canadacentral-01.azurewebsites.net/](https://markfair-api-hxfbajeza6hyfhdh.canadacentral-01.azurewebsites.net/)

## Getting Started

### Prerequisites

- Node.js 18+ for frontend and scripts
- Python 3.9+ for backend
- Docker for local development
- Starknet wallet (Argent X or Braavos recommended)
- Git for version control

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

### Available Scripts

**Frontend Scripts:**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

**Backend Scripts:**
- Follow the backend README for available commands

**Smart Contract Scripts:**
- Merkle tree generation and verification scripts
- Complete verification testing suite

### Deployment

**Frontend Deployment:**
The frontend builds to static files that can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Backend Deployment:**
- Docker containerization supported
- Cloud platform deployment ready

**Smart Contracts:**
- Deployed on Starknet Sepolia (testnet)
- Mainnet deployment planned for Q4 2025

## Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
