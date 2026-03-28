---
name: base-payments-dapp-architect
description: Use this skill when working on the LockIn stablecoin escrow product or any Base-first payments dApp that needs real product framing, contract architecture, wallet UX, backend modules, indexing, security, and delivery sequencing.
---

# Base Payments dApp Architect

## Purpose

This skill exists to keep work on the LockIn product opinionated and production-focused.

The default product is:

- Base-first
- USDC-settled
- Stablecoin escrow for milestone work
- Retainer billing with Base subscriptions
- Embedded-wallet friendly
- Backend-heavy, not "frontend + contract only"

## Mandatory defaults

1. Optimize for real payments, not speculative token mechanics.
2. Prefer Base unless there is a written reason to change the chain.
3. Keep funds-bearing contracts simple and narrow.
4. Use a custom indexer as the internal source of truth.
5. Use real wallet, API, and database flows. No fake balances, mock tx history, or placeholder settlement logic.
6. Treat onboarding quality as a core product requirement.

## Chain stance

Default chain: `Base`

Why:

- Smart-wallet and passkey onboarding
- Low-fee USDC payments
- Gas sponsorship
- Recurring spend permissions and subscriptions
- EVM maturity
- Strong onramp adjacency

If another chain is proposed, compare it against Base on:

- User onboarding friction
- Stablecoin liquidity and payments fit
- Contract tooling maturity
- Indexing reliability
- Auditability and operations burden

## Product stance

Preferred wedge:

- Global freelance and agency escrow
- Verified milestone releases
- Repeat-client retainers
- Portable settlement reputation

Avoid starting with:

- Tokens
- Yield farming
- NFT speculation
- Governance theatrics
- Cross-chain complexity without clear revenue value

## Architecture stance

### Frontend

- Next.js App Router
- React 19
- Tailwind + shadcn/ui + Framer Motion
- wagmi + viem + OnchainKit
- Privy for embedded wallets and auth

### Backend

- NestJS
- Postgres + Prisma
- Redis + BullMQ
- Storage for evidence artifacts
- Sentry + OpenTelemetry

### Contracts

- Solidity + Foundry + OpenZeppelin
- Factory + cloned escrow vaults
- Minimize upgradeability on funds-bearing modules

### Indexing

- Custom webhook + polling hybrid
- Idempotent projection updates
- Reorg recovery job
- Optional Graph subgraph only as a secondary/public read layer

## Execution order

1. Contract events and state machine
2. Indexer and projection model
3. Backend auth and deal orchestration
4. Funding UX
5. Release/dispute UX
6. Retainers and reputation

## Deliverables to produce by default

- Product decision summary
- Chain comparison with rationale
- Contract module list
- API route map
- Database schema outline
- Folder structure
- Security risks and mitigations
- MVP and V1 roadmap

## Reference files

- `../../docs/architecture.md`
- `../../docs/roadmap.md`

Read those first before making architectural changes.
