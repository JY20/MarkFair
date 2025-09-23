# MarkFair Smart Contracts

MarkFair brings fair, transparent payouts between brands and creators (KOLs) on Starknet.

What this contract does (plain English):

- Escrow the campaign budget in a token vault per “pool”. Funds are held safely until settlement.
- Lock the final results on-chain using a Merkle root (creator shares) approved by the platform signer.
- Creators claim their payout trustlessly with a Merkle proof; no central party needed.
- Optional “epochs” allow multiple settlement rounds for the same pool.
- Brand can refund the unclaimed remainder after the deadline.

Safety & integrity:

- Signature verification (Stark curve ECDSA) with domain separation + nonces to prevent replay.
- OpenZeppelin Pedersen Merkle verification for proofs.
- Reentrancy guard, pause switch, and strict parameter/time checks.

Interoperability:

- Works with standard ERC20 tokens (approve → fund → claim/refund).
- Clean ABI for both reads (status, amounts) and writes (fund, finalize, claim, refund).

Why it matters:

- Transparent math (shares × unit price) and audit-friendly events.
- Trust-minimized payouts at O(log N) verification cost.

For developers:

- See `instructions/Smart Contract Tech Spec ...md` for integration details (ABI, hashing, proofs).
- Devnet-ready: quick local testing with predeployed accounts and example token (MARK).
