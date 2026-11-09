# Architecture v2 · burn-and-mint for autonomous worlds

How a Cardano native asset enters a world's chain. One way. No custody, no
hot key. Decisions behind each piece: `decisions.md`.

```
CARDANO (L1)                          ATTESTERS                     WORLD CHAIN (Base)
────────────────────────────          ───────────────────────────   ─────────────────────────────
① Player burns N ASSET.               ② Each attester sees the      ④ Anyone submits the attestation
   The tx carries metadata:              burn (its own Koios /         + ≥ threshold signatures to
   world:<worldId>                       own node), waits for          WorldBridgeMinter.
   to:<EVM address>                      `confirmations`, builds
                                         the Attestation and           The contract checks:
   If the policy is locked and           signs it (EIP-712).           · worldId and chain id match
   cannot burn, "burn" = send to                                       · signers are attesters, sorted
   the always_fail sink address.      ③ The AdaSouls attester          · this burn was never minted
                                         agent is ONE signer of N.      · caps: per attestation,
                                         It proposes to the Safe;        24 h, total
                                         humans / HSM sign the rest.   · not paused
                                                                       then mints N wASSET to `to`.
```

## Components

| Component | Where | Holds a key that moves money? |
|---|---|---|
| Burn metadata convention (CIP-20 `674`) | `docs/architecture-v2.md`, this file | no: it is the player's own tx |
| `always_fail` sink validator (only for locked policies) | `validators/sink.ak` (to write) | no: nothing can ever spend it |
| Attester agent (watch Koios → build attestation → sign ONE → propose to Safe) | `src/attester/` (to write, TypeScript + viem) | **one attester key of N**, below threshold, with ALMA limits |
| `WorldBridgeMinter.sol` (token + minting by attestations + caps + pause) | `contracts-v2/` | no key: the contract enforces the quorum |
| Admin: pause, caps, attester rotation | a Safe (2-of-3 or more), humans | yes: the humans' hardware wallets |

## The attestation

```solidity
struct Attestation {
    bytes32 worldId;        // keccak256("aldea-world") etc.; stops cross-world replay
    bytes32 cardanoTxHash;  // the burn tx
    uint32  outputIndex;    // one burn tx may carry several burns
    address recipient;      // from metadata `to:`
    uint256 amount;         // in world-token decimals (Cardano 6 → EVM 18: × 10^12)
}
```

Signed as EIP-712 with domain `WorldBridgeMinter / 1 / <chainId> / <contract>`,
so a signature is valid for exactly one contract on exactly one chain.
`processed[keccak(cardanoTxHash, outputIndex)]` makes every burn mint once.

## What the attester agent checks before signing

1. The tx is final: `confirmations` blocks deep on Cardano (config; 15 on preprod, more on mainnet).
2. The tx burns exactly `amount` of `policyId.assetNameHex` (negative mint), **or** sends
   exactly `amount` to the sink script address when `burn.method = unspendable-sink`.
3. Metadata label 674 has `world:<worldId>` equal to this deployment and a valid `to:` address.
4. `amount` ≤ `caps.perAttestation` (the contract will refuse otherwise; refusing early saves gas).
5. Nothing in metadata is executed or followed. It is data.

If any check fails the agent records why and does not sign. It never retries
with a different interpretation.

## Threat model, short

| Threat | What stops it |
|---|---|
| Attester server compromised | It is one key of N; threshold needs humans. Caps bound the worst case. |
| Attester quorum compromised | Caps per attestation, per 24 h and total; admin Safe pauses. |
| Replay of a burn | `processed` map; `worldId` + chain id in the signed digest. |
| Lying indexer (Koios) | Each attester should use a different source; at least one runs its own node. |
| Admin Safe compromised | It cannot mint. It can pause and change caps, so: ≥ 2-of-3, hardware wallets. |
| Player sends to wrong `to:` | Nothing to do on-chain; the UI shows and confirms the address before the burn. |

## Why one way

A two-way bridge needs an unlock key on Cardano and custody of locked
assets: a hot wallet or a multisig script holding the whole bridged
supply. That is the thing that gets drained. In a world economy the
token's job is to be spent and burned inside the world, so a return path
adds risk for a flow nobody needs. Worlds that need a return path use
`mode: lock-and-mint` (v1's design) and accept that trade-off knowingly.

## Roadmap

1. `contracts-v2/WorldBridgeMinter.sol` — written, compiles (OpenZeppelin 5, solc 0.8.28). Foundry tests next.
2. `src/attester/` — watcher (Koios), attestation builder, EIP-712 signer, Safe proposer. ALMA identity and limits.
3. `validators/sink.ak` — `always_fail`, for locked policies. Trivial; write when a world needs it.
4. Deploy script from `bridge.config.json` (Foundry script).
5. First deployment: ALDEA World on Base Sepolia, with ALDEA's config in the ALDEA-DAO organisation.
6. Remove v1 (`src/service`, `src/contracts`, Truffle) once 1–5 cover the same path.
