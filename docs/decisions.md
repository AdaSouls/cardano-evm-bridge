# Decisions

Architecture decisions for the bridge, newest first. Each one says what we
decided, why, and what it rules out. Change a decision by adding a new entry
that supersedes it, not by editing the old one.

## 2026-11-09 · D7 · ALDEA is the first world, not the only one

**Decision.** The code in this repository knows nothing about ALDEA. Every
world-specific value (asset, chain, caps, signers, mode) lives in a
`bridge.config.json` that the operator provides. ALDEA World's config lives
in the ALDEA-DAO organisation, next to the world it serves.

**Why.** AdaSouls' offer is "an autonomous world for your brand". Every
brand world will need the same thing: move a Cardano native asset into the
world's chain. One generic bridge, many configs. Hard-coding ALDEA (as v1
did: `mintAldeaTo`, `unlockAldeaTokens`, a fixed policy id) means forking
the repo per world.

**Rules out.** Any reference to a specific token, policy id, chain id or
address in code. Tests use fixtures named `example`, never `aldea`.

## 2026-11-09 · D6 · Burn-and-mint, one way, is the default mode

**Decision.** The default bridge mode is `burn-and-mint`: the asset is
destroyed on Cardano and the same amount is minted on the world chain.
There is no path back. `lock-and-mint` (v1's behaviour: lock on Cardano,
mint on EVM, burn on EVM to unlock) stays available as a mode for worlds
that need a return path, but it is not the default.

**Why.** An autonomous world's token is a utility token: it is spent and
burned inside the world (seasons, upgrades, pacts). A one-way bridge has no
custody (nothing is locked, so nothing can be stolen or stuck), no
unlock key on Cardano, half the attack surface and half the code. It also
matches the supply story: total supply across both chains never grows, and
what enters the world eventually leaves it through sinks.

**Rules out.** A hot Cardano key on the server (D4). In burn-and-mint mode
the Cardano side needs no signer at all.

**Open question.** Whether the real ALDEA minting policy allows burning. A
time-locked native-script policy cannot burn after its deadline. If it
cannot, "burn" means sending to a provably unspendable script address (an
`always_fail` validator); the attester treats both the same way. Check the
policy before building the Cardano side.

## 2026-11-09 · D5 · Minting is authorised by attestations, executed by a Safe

**Decision.** Nothing mints on the world chain without an attestation:
`{cardanoTxHash, outputIndex, amount, recipient, worldId}` signed by a
threshold of attesters. The `WorldBridgeMinter` contract verifies the
signatures, checks the caps and mints. The attester set is a Safe
(multisig) or a set of EOAs whose threshold the contract enforces. The
AdaSouls attester agent **proposes** attestations; it is at most one
signature of N and never reaches the threshold alone.

**Why.** D4. A single admin key that can mint is the whole risk of a
bridge. With threshold attestations, a leaked server key cannot mint.

**Rules out.** `onlyAdmin` mint (v1's `BridgeBase.mint`). Any path where
one process both observes the burn and mints.

## 2026-11-09 · D4 · No key that moves money on a server

**Decision.** The bridge service holds no private key that can move or
create value: no Cardano admin mnemonic, no EVM admin key. It reads chains,
builds attestations and proposes them. Signatures come from humans with
hardware wallets, from a Safe, or from an HSM with daily limits that a
human configured.

**Why.** The AdaSouls rule: "AdaSouls never holds a key that moves money".
v1's `.env.example` asked for `CARDANO_ADMIN_MNEMONIC` and
`EVM_ADMIN_PRIVATE_KEY`; that is the thing we never do.

**Rules out.** Every `*_PRIVATE_KEY` / `*_MNEMONIC` variable in the
service's environment.

## 2026-11-09 · D3 · Caps in the contract, not in the service

**Decision.** `WorldBridgeMinter` enforces a maximum per attestation, a
maximum per rolling 24 hours, a total cap, and a pause switch. The service
cannot raise them; only the contract's admin role (a Safe) can.

**Why.** Limits that live in off-chain code disappear when the off-chain
code is compromised. Limits in the contract bound the damage of any failure
upstream, including a compromised attester quorum.

## 2026-11-09 · D2 · Base is the first world chain; the contracts are chain-agnostic

**Decision.** The first deployment target is Base (Sepolia, then mainnet).
The Solidity side uses nothing Base-specific; any EVM chain is a config
value. v1 targeted Garnet (Redstone's testnet), which shut down with
Redstone in May 2026.

**Why.** Base has 2-second blocks, sub-cent fees, Coinbase Smart Wallet
onboarding and is where the MUD worlds moved after Redstone closed.

## 2026-11-09 · D1 · Foundry replaces Truffle; viem replaces web3 + ethers v5

**Decision.** New contracts are built and tested with Foundry (`forge`).
The service uses viem. v1's Truffle setup and the web3 + ethers-v5 mix are
kept only until the v2 service replaces them, then removed.

**Why.** Truffle is unmaintained since 2023. viem is what the MUD and
world-connoisseur code already use; one client library across repos.

## Earlier (v1, 2025) · superseded

v1 was built for ALDEA as a lock-and-mint, two-way bridge with a single
admin key on each side, Blockfrost webhooks as the event source, and
Truffle for the contracts. It worked on preprod and Garnet. D1–D7 replace
its design; its code stays in `src/` and `validators/` until v2 covers the
same path, then it is removed.
