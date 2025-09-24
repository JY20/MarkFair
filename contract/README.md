# MarkFair KolEscrow Contract

## Directory Structure

```
contract/
├── src/                          # Cairo contract source code
│   ├── lib.cairo               # Main contract implementation
│   └── markfair_token.cairo    # ERC20 token contract
├── scripts/                      # JavaScript scripts and tools
│   ├── finalize_and_claim.mjs  # Merkle tree generation and signing script
│   ├── finalize_and_claim.ts   # TypeScript version
│   ├── out.json                # Generated signature data
│   └── package.json            # Node.js dependencies
├── strk-merkle-tree/            # Starknet Merkle Tree library
│   └── src/                    # TypeScript source code
├── instructions/                # Documentation and guides
│   ├── DEPLOY_TESTNET.md       # Testnet deployment guide
│   ├── Merkle_tree.md          # Merkle Tree implementation guide
│   ├── TEST_LOG.md             # Complete test log
│   └── Smart Contract Tech Spec.md # Technical specification
├── target/                      # Compilation output
│   ├── dev/                    # Development build
│   └── release/                # Release build
├── tests/                       # Test files
├── Scarb.toml                  # Scarb configuration
├── snfoundry.toml              # Starknet Foundry configuration
└── devnet_accounts.json        # Development network account config
```

## Quick Start

### 1. Compile Contracts

```bash
scarb build
```

### 2. Run Test Scripts

```bash
cd scripts/
node finalize_and_claim.mjs
```

### 3. Deploy to Testnet

See `instructions/DEPLOY_TESTNET.md` for detailed steps.

## Deployed Contracts

### Starknet Sepolia Testnet

- **KolEscrow**: `0x0542602e67fee6bfbea8368b83f1933ede566c94ef37624bec6a60c7831d2115`
- **MarkFair Token**: `0x015d942cee86bb00aee0b17aeb6dddb8de07074284a365505960f244ffe44a95`

## Important Documentation

1. **[Deployment Guide](instructions/DEPLOY_TESTNET.md)** - Complete testnet deployment process
2. **[Merkle Tree Implementation](instructions/Merkle_tree.md)** - JavaScript and Cairo compatible implementation
3. **[Test Log](instructions/TEST_LOG.md)** - Detailed test verification records
4. **[Technical Specification](instructions/Smart%20Contract%20Tech%20Spec%202735450c0260801f81f6d744f00f3b25.md)** - Complete contract technical specification

## Development Tools

### Required Tools

- [Scarb](https://docs.swmansion.com/scarb/) - Cairo package manager
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/) - Development and testing tools
- [Node.js](https://nodejs.org/) - JavaScript runtime for scripts

### Recommended Tools

- [starknet-devnet](https://github.com/0xSpaceShard/starknet-devnet-rs) - Local development network
- [Cairo VSCode Extension](https://marketplace.visualstudio.com/items?itemName=starkware.cairo1) - Syntax highlighting and IntelliSense

## Test Status

✅ **Fully Tested** - All functionality verified on Sepolia testnet  
✅ **Production Ready** - Contract and JavaScript fully compatible  
✅ **Complete Documentation** - Includes comprehensive integration guides

## Contact

For questions or suggestions, please refer to the detailed documentation in the `instructions/` directory.
