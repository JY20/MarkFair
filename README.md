# MarkFair

<p align="center">
  <img src="markfair_logo.png" alt="MarkFair Logo" width="500"/>
</p>

## Inspiration

Web3 startups struggle to get noticed, while KOLs and creators spend hours chasing opportunities. Traditional campaigns lack transparency and security — both advertisers and creators risk being "rugged." We wanted a **fair, efficient way** to connect the two worlds with on-chain escrow and verifiable attribution.

## Our Team

<p align="center">
  <img src="assets/background/McMaster_University_logo.svg.png" alt="McMaster University" height="60"/>
  <img src="assets/background/NYU-Logo.png" alt="New York University" height="60"/>
  <img src="assets/background/University-of-Utah-Logo.png" alt="University of Utah" height="60"/>
  <img src="assets/background/rbc-capital-markets.png" alt="RBC Capital Markets" height="60"/>
  <img src="assets/background/Alibaba-Logo.png" alt="Alibaba" height="60"/>
</p>

Our team brings together diverse expertise from top academic institutions and industry leaders:

- **Atlas** - Frontend Developer | Alibaba
- **Jimmy** - Full Stack Developer | McMaster University & RBC Capital Markets
- **Leo** - Backend Developer | University of Utah
- **Mark** - Smart Contract Developer | New York University

With backgrounds spanning blockchain development, finance, and enterprise software, our team combines technical expertise with business acumen to build a platform that addresses real market needs.

## What it does

- **Advertisers**: Create campaigns and deposit funds into a Starknet escrow contract.  
- **KOLs**: Receive personalized shortlinks to share with their audiences.  
- **Users**: Simply click the link — attribution is seamless, no extra steps.  
- **Settlement**: At the end of each epoch, a Merkle Root is generated. Advertisers can review results, KOLs can claim their rewards, and unclaimed funds are automatically refunded to advertisers.

## How we built it

- **Frontend**: React + Clerk for authentication and campaign/KOL dashboards.  
- **Backend**: FastAPI for shortlink generation, attribution binding, and ROI aggregation.  
- **On-chain**: Starknet smart contracts using OpenZeppelin-based Merkle Root verification to secure escrow deposits and epoch-based settlements.

## Challenges we ran into

- **Documentation mismatch**: Starknet docs and OpenZeppelin standards differed, requiring significant work to standardize Merkle Root generation.  
- **Settlement design**: Needed to balance KOL claims with advertiser safety; we chose a model where unclaimed rewards are refunded to advertisers.  
- **Seamless attribution**: Designed shortlink-based binding for a frictionless user experience.

## Accomplishments that we're proud of

- Built a working MVP demonstrating **secure on-chain escrow + Merkle Root settlements**.  
- Achieved **frictionless attribution** with shortlink-based binding.  
- Established a complete pipeline: advertiser deposit → KOL distribution → user click → ROI tracking → settlement/refund.

## What we learned

- **ROI is the real KPI**: Web3 marketing success depends on proving ROI, not just raw user counts.  
- **User experience is king**: Invisible attribution flows increase adoption.  
- **Standardization is critical**: Documentation and library divergence makes standardization essential.

## What's next for MarkFair

1. **Standardized ROI metrics**: Use NFT/token mints on link click for public, transparent ROI tracking.  
2. **Multi-platform expansion**: Support TikTok, Twitter(X), Xiaohongshu, and more.  
3. **AI matching engine**: Recommend optimal KOL–advertiser pairings for efficient campaigns.  
4. **Dynamic escrow pools**: Support epoch-based fund release (e.g. 3-month campaign, payouts every 3 days) for better liquidity.  
5. **Yield integration**: Stake escrowed funds to offset lock-up costs and generate yield for advertisers.

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

- `assets/` - Project assets and resources
  - `background/` - Background images and logos
  - `UI/` - User interface design images and mockups

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
   git clone https://github.com/JY20/MarkFair.git
   cd MarkFair
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


## Connect With Us

- **GitHub**: [@JY20/MarkFair](https://github.com/JY20/MarkFair)
- **X (Twitter)**: [@markfairxyz](https://x.com/markfairxyz)
- **Discord**: [Join our community](https://discord.gg/9PqNYPhKng)

---

**MarkFair** - Making Web3 marketing simpler, more transparent, and fairer 🚀
