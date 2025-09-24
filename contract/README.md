# MarkFair KolEscrow Contract

## Directory Structure

```
contract/
├── src/                          # Cairo contract source code
│   ├── lib.cairo               # Main contract implementation
│   └── markfair_token.cairo    # ERC20 token contract
├── scripts/                           # JavaScript scripts and tools
│   ├── devnet_merkle_generator.mjs    # Devnet环境Merkle生成器（前端开发用）
│   ├── pool_deployment_generator.mjs  # Pool部署命令生成器（后端运维用）
│   ├── testnet_hash_validator.mjs     # 测试网哈希验证器（前端验证用）
│   ├── backend_merkle_generator.mjs   # 后端Merkle生成器（后端集成用）
│   ├── backend_merkle_generator.py    # 后端Merkle生成器（Python版本）
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

- **KolEscrow**: `0x0208b971642fa7a85733d433895d6c6b83dc4eda4e04067be15847a03d7d4524`
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
