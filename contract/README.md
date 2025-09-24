# MarkFair KolEscrow Contract

## Directory Structure

```
contract/
├── src/                          # Cairo contract source code
│   ├── lib.cairo               # Main contract implementation
│   └── markfair_token.cairo    # ERC20 token contract
├── scripts/                           # JavaScript scripts and tools
│   ├── complete_verification.mjs      # 完整端到端验证测试（运维测试用）
│   ├── backend_merkle_generator.mjs   # 后端Merkle生成器（后端集成用）
│   ├── devnet_merkle_generator.mjs    # Devnet环境开发测试（前端开发用）
│   ├── out.json                       # 生成的测试数据
│   └── package.json                   # Node.js依赖配置
├── instructions/                # Documentation and guides
│   ├── deploy_testnet.md       # Testnet deployment guide
│   ├── merkle_tree.md          # Merkle Tree implementation guide
│   └── smart_contract_spec.md  # Technical specification
├── target/                      # Compilation output
│   ├── dev/                    # Development build
│   └── release/                # Release build
├── tests/                       # Test files
├── Scarb.toml                  # Scarb configuration
└── snfoundry.toml              # Starknet Foundry configuration
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

- **KolEscrow**: `0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a` (最终优化版本)
- **MarkFair Token**: `0x07cc3116574d1cb35face2e22a38052d1ddac612b34be2f37599431985e62ae9`

## Important Documentation

1. **[Deployment Guide](instructions/deploy_testnet.md)** - Complete testnet deployment process
2. **[Merkle Tree Implementation](instructions/merkle_tree.md)** - JavaScript and Cairo compatible implementation
3. **[Technical Specification](instructions/smart_contract_spec.md)** - Complete contract technical specification

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
