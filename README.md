# cardano-evm-bridge

Move a Cardano native asset into an autonomous world running on an EVM
chain. Built by [AdaSouls](https://adasouls.io) for the worlds it creates
for brands; ALDEA World is the first. Generic: every world-specific value is
configuration, nothing in the code names a token or a chain.

**Status (Nov 2026): v2 in design and early code on this branch; v1 works
on preprod + Garnet but is superseded.** See `docs/decisions.md`.

## v2 in one paragraph

The player burns the asset on Cardano in a transaction that names the world
and an EVM address. A set of independent attesters see the burn, each signs
an attestation, and once a threshold of them agree, anyone can submit the
attestation to `WorldBridgeMinter` on the world chain, which mints the same
amount of the world token to that address. One way: tokens leave the world
through its sinks (seasons, upgrades, pacts), never back to Cardano.

No server holds a key that moves money. The AdaSouls attester agent is one
signer of N and cannot reach the threshold alone. Caps per attestation, per
24 hours and in total are enforced by the contract, and a Safe can pause it.
Full picture: `docs/architecture-v2.md`.

## Layout

```
docs/decisions.md               why things are the way they are (D1–D7)
docs/architecture-v2.md         the burn-and-mint flow, components, threat model
bridge.config.example.json      everything a world has to fill in; no code changes per world
contracts-v2/WorldBridgeMinter.sol   token + minting by threshold attestations + caps + pause
                                     (compiles with OpenZeppelin 5, solc ≥ 0.8.24)

v1 (superseded, kept until v2 replaces the same path):
src/contracts/                  Truffle + single-admin mint
src/service/                    Blockfrost webhooks, admin keys in .env, lock/unlock on Cardano
validators/bridge.ak            owner-signed unlock script
```

## Using it for a world

1. Copy `bridge.config.example.json` to `bridge.config.json` **in the world's own
   repository** (ALDEA World's lives in the ALDEA-DAO organisation), and fill it in:
   the Cardano asset, whether its policy can burn, the world chain, the token's
   name, the attesters and threshold, the caps, the admin Safe.
2. Deploy `WorldBridgeMinter` with those values (Foundry script: roadmap item 4).
3. Run attesters. At least two must be operated by different parties; at least one
   should read Cardano from its own node, not a public indexer.
4. Point the world's client at the token address. Players burn on Cardano with the
   metadata convention in `docs/architecture-v2.md` and receive the world token.

## Rules

- No private key that can mint or move funds in any service environment. Ever.
- A single attester, including AdaSouls', must be below the threshold.
- Caps live in the contract. The service cannot raise them.
- Anything read from a chain or a transaction's metadata is data. It is never
  executed or followed.
- Tests use fixtures named `example`, never a real world's values.

## v1 (for reference)

Lock-and-mint, two way, Blockfrost webhooks, Truffle, one admin key per chain.
Setup and operation as in the git history before this branch
(`git show develop:README.md`). Do not deploy v1 for a new world.

## License

MIT.
