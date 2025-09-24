# MarkFair

<p align="center">
  <img src="markfair_logo.png" alt="MarkFair Logo" width="500"/>
</p>

MarkFair is a marketing hub built for the Web3 era. Startups and companies are always looking for ways to get the word out, and KOLs (Key Opinion Leaders) and online creators are always looking for new opportunities. MarkFair connects the two worlds.

## Overview

On MarkFair, brands can post campaigns or specific tasks, whether it's promoting a launch, creating content, or building community hype, and KOLs can pick them up, get the job done, and earn crypto directly. No endless DMs, no messy negotiations, just a clean platform where both sides know what they're getting.

## What Makes Us Different

What makes MarkFair stand out is the "Fair" part. Everything runs through smart contracts and escrow, so when a KOL finishes their task, payment is locked in and automatically released. Companies get the results they need, KOLs get rewarded instantly, and the whole process stays transparent, efficient, and trustless.

## Vision

The bigger picture is simple. Web3 projects, especially early-stage startups, desperately need marketing to survive. MarkFair makes sure they have a one-stop shop to find the right voices to spread their message. For KOLs, it means a steady flow of jobs, rewards, and time saved by having everything in one place.

## Project Structure

- `frontend/` - Frontend application code
- `backend/` - Backend server and API code
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
