# LockIn Stablecoin Escrow

This plugin packages a production-grade architecture for a real-world blockchain product: a USDC milestone escrow and retainer network for freelancers, agencies, and SMB buyers.

The core recommendation is to build `LockIn` on Base, not as a speculative DeFi clone, but as a programmable payments product with:

- Milestone escrow for project work
- Optional recurring retainers using Base spend permissions
- Embedded or external wallets for low-friction onboarding
- A real backend, event indexer, dispute operations layer, and audit trail

## Included

- `docs/architecture.md`
  Product framing, chain comparison, chosen architecture, frontend/backend/contracts, wallet flow, and security posture.
- `docs/roadmap.md`
  Delivery phases, folder structure, database schema, API surface, contract modules, and deployment order.
- `skills/base-payments-dapp-architect/SKILL.md`
  Reusable operating guidance for future work on this product.
- `scripts/scaffold_monorepo.sh`
  Creates the recommended monorepo directory layout under a target directory.

## Recommended product thesis

Global service work still runs on slow wires, platform lock-in, and weak escrow tools. LockIn turns that into:

- Instant USDC funding on Base
- Milestone-by-milestone release control
- Retainer billing with revocable spend permissions
- Onchain completion attestations and reputation
- Embedded wallet onboarding for non-crypto-native users

## Use this plugin

1. Read `docs/architecture.md`.
2. Read `docs/roadmap.md`.
3. If you want the starter tree, run:

```bash
zsh ./scripts/scaffold_monorepo.sh /absolute/path/to/new-project
```

4. Use the included skill when asking for implementation work.
