# Contract Integration

This document describes how the backend interacts with the KolEscrow smart contract deployed on Starknet.

## Contract Address

The KolEscrow contract is deployed at:
```
0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a
```

## API Endpoints

### Get Pool Information

```
GET /api/contract/pool/{pool_id}
```

Retrieves information about a specific pool from the smart contract.

#### Response

```json
{
  "brand": "0x...",
  "token": "0x...",
  "attester_pubkey": "0x...",
  "status": 2,
  "funded_amount": 1000000000000000000,
  "total_claimed_amount": 500000000000000000,
  "current_epoch": 1,
  "allocated_shares": 1000,
  "unit_k": 1000000000000000,
  "merkle_root": "0x...",
  "deadline_ts": 1698765432,
  "refund_after_ts": 1699765432
}
```

### Get Epoch Metadata

```
GET /api/contract/pool/{pool_id}/epoch/{epoch}
```

Retrieves metadata about a specific epoch in a pool.

#### Response

```json
{
  "merkle_root": "0x...",
  "total_shares": 1000,
  "unit_k": 1000000000000000,
  "deadline_ts": 1698765432,
  "refund_after_ts": 1699765432,
  "claimed_amount": 500000000000000000,
  "status": 2
}
```

### Verify Merkle Proof

```
POST /api/contract/verify-proof
```

Verifies a merkle proof for a distribution record.

#### Request Body

```json
{
  "pool_id": 1,
  "epoch": 1,
  "index": 5,
  "account": "0x...",
  "shares": 100,
  "amount": 100000000000000000,
  "proof": [
    "0x...",
    "0x...",
    "0x..."
  ]
}
```

#### Response

```json
{
  "valid": true
}
```

## Integration with Merkle Tree Generation

The backend provides APIs for generating merkle trees and verifying proofs:

1. `/api/merkle/generate` - Generates a merkle tree from distribution data
2. `/api/merkle/verify` - Verifies a merkle proof against the merkle root
3. `/api/merkle/hash/secure` - Creates a secure hash for a leaf node
4. `/api/merkle/hash/leaf` - Creates a leaf hash for a node

## Integration with Finalization

The backend provides APIs for finalizing epochs:

1. `/api/finalize/domain-hash` - Calculates the domain hash for finalizing an epoch
2. `/api/finalize/sign` - Signs a message hash using ECDSA
3. `/api/finalize/finalize-epoch` - Finalizes an epoch by generating the domain hash and signing it

## Contract Service

The `ContractService` class provides methods for interacting with the KolEscrow contract:

- `get_pool_info(pool_id)` - Gets information about a pool
- `get_epoch_meta(pool_id, epoch)` - Gets metadata about a specific epoch
- `verify_epoch_proof(pool_id, epoch, index, account, shares, amount, proof)` - Verifies a merkle proof
