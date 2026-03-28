# LockIn Architecture

## Best dApp idea options

1. Stablecoin milestone escrow for freelancers and agencies
   Valuable because cross-border services are large, fragmented, and still painfully manual.
   Feasible because the flow maps cleanly to USDC, wallets, attestations, and event indexing.
   Differentiated because most crypto payment tools stop at "send money" and do not solve trust, release rules, disputes, or retainers.
2. Tokenized invoice financing marketplace for SMBs
   High upside, but underwriting, legal structure, and collections make it slower to ship safely.
3. Subscription and usage billing rail for AI SaaS onchain
   Strong fit for Base subscriptions, but less novel and less defensible.
4. Anti-scalping ticketing with escrowed resale rules
   Good consumer story, but distribution is weaker than B2B service payments.
5. Creator licensing and royalty escrow
   Interesting niche, but smaller near-term wedge than global freelance payments.

## Final chosen concept

Build `LockIn`: a stablecoin payments network for global freelance and agency work.

The product combines four workflows into one system:

1. Buyer funds an escrow in USDC on Base.
2. Seller completes milestones and requests release.
3. Buyer approves release or opens a dispute window.
4. Long-term clients can switch from milestone escrow to recurring retainers using Base spend permissions.

## Why this is the strongest option

- The pain is real and non-speculative: delayed settlements, FX friction, chargeback risk, and weak trust tooling still hurt independent work.
- The product is monetizable from day one through escrow fees, retainer tooling, premium dispute handling, and treasury services.
- The architecture can be real, not demo-only: Base gives low-cost USDC payments, smart-wallet UX, gas sponsorship, and on/off-ramp adjacency inside one EVM ecosystem.
- The roadmap can expand into invoice factoring, vendor payouts, payroll, and API-based B2B payment orchestration without replacing the core stack.

## Product vision

LockIn should feel like "Stripe Billing plus escrow plus global contractor ops", but with onchain settlement as infrastructure, not as the product gimmick.

The premium wedge is not "we use crypto". The wedge is:

- Faster funding
- Better trust primitives
- Lower settlement friction
- Clear auditability
- Easier onboarding for non-crypto users

## Innovative features that make it stand out

1. Dual-mode commerce
   A client relationship can start in milestone escrow, then convert into a recurring retainer without leaving the product.
2. Reputation with settlement context
   Ratings are tied to real funded deals and released milestones, which is harder to fake than marketplace reviews.
3. Embedded-wallet first, external-wallet compatible
   Non-crypto-native users can onboard with email and passkeys, while power users can bring MetaMask, Coinbase Wallet, or WalletConnect.
4. Dispute-evidence ledger
   Evidence hashes, release decisions, and milestone outcomes are stored or attested in a verifiable way, creating a portable trust history.
5. Treasury-aware USDC flow
   Onramp, escrow, release, fee collection, and treasury routing are designed as one operational system instead of disconnected hacks.

## Deep technical research and chain choice

### Recommended chain: Base

Base is the best fit for this product.

Why:

- Consumer-grade wallet UX: Base Account exposes passkey-backed smart wallets, one-tap USDC payments, gasless transactions, and batch transactions through the account layer.
- EVM maturity: Solidity, Foundry, OpenZeppelin, viem, wagmi, and the wider Ethereum tooling stack remain the strongest production path.
- Stablecoin and payments focus: Base explicitly supports USDC payment flows and recurring charges through spend permissions and subscriptions.
- Onboarding advantage: Coinbase-hosted and headless Onramp reduce friction for real users funding escrow.
- Security posture: Base inherits Ethereum L2 security properties while keeping user costs low enough for frequent milestone actions.

### Chain comparison

#### Ethereum mainnet

- Security and liquidity are unmatched.
- Not chosen because fees are too high for frequent milestone actions and dispute operations.

#### Base

- Chosen.
- Best combination of low fees, EVM tooling, Coinbase distribution, smart-wallet UX, USDC focus, gas sponsorship, and recurring payment primitives.

#### Polygon

- EVM-compatible and cost-efficient.
- Weaker product-specific advantage than Base for this use case because the strongest payments, passkey, and onramp bundle now sits more clearly in the Base/Coinbase stack.

#### Solana

- Excellent performance and low fees.
- Very strong for consumer apps, but the buyer-side enterprise comfort, EVM contract ecosystem, and Base-native payment primitives make Base the better operational choice here.

#### Flow

- Consumer-oriented and increasingly friendly to EVM builders.
- Attractive for mainstream brands, but smaller general-purpose payments ecosystem for this exact product wedge.

#### Aptos

- Strong account abstraction story with sponsored transactions, keyless accounts, and indexer tooling.
- Technically compelling, but ecosystem fit for USDC escrow + Coinbase rails is weaker than Base.

#### Sui

- Strong object model and high performance.
- Interesting for parallel execution, but weaker distribution and less natural fit for the EVM payments stack needed here.

## Research-backed rationale

The decision is driven by current official platform capabilities, not nostalgia:

- Base Account documents universal sign-on, one-tap USDC payments, gasless transactions, and ERC-4337 smart wallets.
- Base paymaster docs describe sponsored gas, batching, and per-user/global policy controls.
- Base subscriptions docs show production-ready recurring USDC charges with backend execution and paymaster support.
- Coinbase Onramp docs show hosted and headless onramp paths, plus KYC/compliance handled by Coinbase.
- Ethereum L2 docs remain the clearest security foundation for this use case.
- Solana, Aptos, Sui, and Flow each have compelling features, but none matches Base's combined wallet UX, payments primitives, and EVM production maturity for this product.

## User flow

### Buyer journey

1. Land on the product site.
2. Sign in with email/passkey or external wallet.
3. Create a workspace and invite a freelancer or agency.
4. Draft a deal with milestones, amounts, deadlines, and dispute policy.
5. Fund escrow in USDC via wallet balance or fiat onramp.
6. Review submitted milestone evidence.
7. Approve release, request changes, or open dispute.
8. Convert a successful relationship into a retainer subscription.

### Seller journey

1. Receive invite and onboard with embedded wallet or external wallet.
2. Review terms and accept deal.
3. Submit milestone deliverables and evidence.
4. Request release.
5. Withdraw released funds or keep treasury balance for future payments.
6. Build verified reputation tied to settled work.

### Admin and operations journey

1. Review flagged disputes, AML/risk events, and payout anomalies.
2. Trigger compliant support workflows.
3. Manage fee schedules, treasury routing, and paymaster budgets.
4. Inspect an auditable timeline of database records, API actions, and onchain events.

## Full tech stack

### Frontend

- `Next.js 16+` App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `Framer Motion`
- `wagmi` + `viem`
- `OnchainKit`
- `Privy` for embedded wallets and wallet-linked auth
- `TanStack Query`
- `Zod`
- `Recharts` or `ECharts` for treasury and activity analytics

### Backend

- `NestJS`
- `TypeScript`
- `Prisma ORM`
- `PostgreSQL`
- `Redis`
- `BullMQ`
- `S3-compatible object storage` for evidence artifacts
- `OpenTelemetry`
- `Sentry`
- `PostHog`

### Smart contracts

- `Solidity`
- `Foundry`
- `OpenZeppelin Contracts`
- `OpenZeppelin Upgrades` only where upgradeability is justified

### Indexing and blockchain services

- `Custom indexer` built with `viem` and background workers
- `Alchemy webhooks` or equivalent for push-based event delivery
- Optional `The Graph` subgraph for public analytics and external integrations

### Infra

- `pnpm` monorepo
- `Turborepo`
- `Docker`
- `Vercel` for web
- `Railway`, `Render`, or `Fly.io` for API/worker
- `Managed Postgres` such as Prisma Postgres or Neon
- `Managed Redis` such as Upstash or Redis Cloud

## Frontend architecture

### Public surfaces

- Landing page
- Pricing and trust page
- Product explainer with live activity and settlement stats
- Legal and risk disclosures

### Auth and onboarding

- Email/passkey onboarding
- Embedded wallet creation
- External wallet connection
- Workspace setup wizard
- Onramp entry point for first-time funders

### Core app

- Dashboard
- Deals list
- Deal detail timeline
- Milestone submission and release screens
- Treasury and portfolio page
- Retainers and recurring billing page
- Activity and audit history page
- Profile, linked wallets, payout preferences, security settings

### Admin

- Dispute queue
- Risk alerts
- Treasury fee dashboard
- Paymaster usage dashboard
- Webhook and indexer health

### Frontend quality bar

- Use server components for SEO-heavy public pages.
- Use client components only where wallet state, motion, or real-time interactions are required.
- Treat trust as a first-class design concern: status chips, transaction states, explorer links, verified counterparties, and dispute clocks must be explicit.
- Avoid "crypto carnival" UI. The visual language should resemble premium fintech software, not token speculation.

## Backend architecture

### Modules

1. `AuthModule`
   Handles Privy JWT verification or wallet-signature auth, session issuance, nonce challenges, wallet linking, and organization membership.
2. `UserModule`
   Profiles, settings, roles, payout preferences, compliance metadata.
3. `WorkspaceModule`
   Buyer and seller organizations, team invites, permissions, and linked counterparties.
4. `DealModule`
   Deals, milestones, attachments, review windows, release statuses.
5. `EscrowModule`
   Contract orchestration, deposit intents, release calls, refunds, failure recovery.
6. `SubscriptionModule`
   Retainers built on Base subscriptions or spend permissions.
7. `IndexerModule`
   Contract event ingestion, reorg handling, cursor checkpoints, backfills.
8. `NotificationModule`
   Email, in-app, webhook, and optional Telegram/Slack notifications.
9. `RiskModule`
   Velocity checks, sanction-list adapters, transaction anomaly heuristics.
10. `AdminModule`
    Support actions, dispute review, treasury ops, manual overrides with audit logging.
11. `AuditModule`
    Immutable operational audit logs for critical backend actions.

## Smart contract architecture

### Design principle

Funds-bearing contracts should be as immutable and simple as possible.

That leads to:

- Upgradeable factory and governance surfaces if needed
- Non-upgradeable cloned escrow vaults for actual deal funds
- Narrow interfaces and explicit event emission

### Core modules

1. `EscrowFactory`
   Creates new escrow instances with deterministic parameters.
2. `EscrowVault`
   Holds one deal's funds, milestones, and release state.
3. `FeeTreasury`
   Receives protocol fees and routes them to treasury wallets.
4. `DisputeResolver`
   Stores arbitrator roles and executes dispute outcomes.
5. `AccessRegistry`
   Optional registry for approved operators, paymasters, and integration addresses.
6. `ReputationEmitter`
   Emits verified work-completion and settlement events, or bridges to an attestation system.

### EscrowVault state machine

- `Draft`
- `Funded`
- `Active`
- `ReleasePending`
- `PartiallyReleased`
- `Disputed`
- `Resolved`
- `Closed`
- `Refunded`

### Why not put everything onchain

Keep these onchain:

- Funding state
- Release approvals
- Refund paths
- Dispute outcomes
- Fee calculations
- Final settlement events

Keep these offchain:

- File storage
- Rich evidence content
- Search and reporting
- Notifications
- Analytics
- Fraud heuristics
- Team collaboration metadata

## Wallet integration flow

### Default path

1. User signs in with Privy email/passkey.
2. Privy provisions an embedded wallet.
3. Backend verifies the auth token and creates a user/workspace.
4. Frontend fetches funding status and prompts onramp or wallet deposit.
5. User signs escrow funding or approval actions with the embedded wallet.

### Power-user path

1. User connects Coinbase Wallet, MetaMask, or WalletConnect.
2. Backend links the wallet to the existing user.
3. Deal and treasury surfaces show wallet-specific balances, tx history, and funding actions.

### Why this flow wins

- Lowest-friction onboarding for non-crypto users
- External-wallet compatibility for crypto-native users
- Clean separation between authentication, custody, and application permissions

## Off-chain and on-chain interaction flow

1. Frontend creates a deal draft in the backend.
2. Backend issues a typed funding intent and stores expected contract parameters.
3. User signs and sends the transaction.
4. Backend receives immediate tx hash and stores a pending state.
5. Indexer confirms chain events and projects them into Postgres.
6. Frontend reads from backend projections, not directly from chain for every table row.
7. Critical detail pages may also read onchain directly for verification and fallback.

## API layer and indexing strategy

### Recommended strategy

Use a custom indexer as the product source of truth, with The Graph as optional secondary infrastructure.

Why:

- The app needs private, operational projections tied to users, organizations, disputes, notifications, and retries.
- The app needs idempotent jobs and reorg handling, not only public queryability.
- The app should not block internal operations on a third-party indexing dependency.

### Indexing pipeline

1. Contract emits canonical events.
2. Blockchain provider pushes webhooks for watched contracts.
3. Indexer validates signatures, persists raw payloads, and enqueues jobs.
4. Worker decodes logs with ABI, applies idempotent projection updates, and advances block cursors.
5. Nightly backfill job reconciles missed blocks and reorg corrections.
6. Optional Graph subgraph mirrors public entities for ecosystem consumption.

## Security plan

### Smart contract security

- Use OpenZeppelin primitives.
- Prefer cloned immutable vaults over upgradeable vault balances.
- Reentrancy guards on release and refund paths.
- Pull-based withdrawals where practical.
- Strict role boundaries for dispute resolution and treasury.
- Event completeness for every externally relevant state transition.
- Unit, integration, fuzz, and invariant testing with Foundry.
- Timelocked governance for upgradeable control planes.

### Backend security

- Verify every wallet-linked action against workspace membership and deal state.
- Rate limit auth, funding-intent creation, webhook intake, and admin operations.
- Use idempotency keys for all write APIs and chain orchestration paths.
- Store secrets only in managed secret stores.
- Signed webhook verification for providers.
- Full audit logs on support and admin actions.
- Zod DTO validation at API boundaries plus Prisma-level relational constraints.

### Wallet session safety

- Nonce-based signature challenges for wallet linking.
- Short-lived backend access tokens with rotating refresh tokens.
- Session binding to device and user agent risk checks where reasonable.
- Sensitive actions require fresh signature or re-auth.

### Replay and front-running

- Backend generated intents include expiry and nonce.
- Funding and release calls use deterministic deal IDs and milestone IDs.
- Avoid mempool-sensitive "price discovery" logic in contracts.
- Dispute open windows and review periods are explicit and contract-enforced.

### Safe transaction UX

- Every signing step shows contract, amount, token, recipient, and fee impact.
- Show pending, confirmed, failed, and reorg-corrected states separately.
- Link to explorer views and expose raw tx hashes.

## Best implementation strategy

### Build first

1. Product and trust model
2. Escrow contract and event model
3. Backend projections and indexer
4. Funding and release UX
5. Dispute operations
6. Retainers and subscriptions

### Validate early

- Can a normal buyer onboard without already owning crypto
- Can a funded deal be created and settled end to end without manual database edits
- Can the indexer survive retries, duplicate webhooks, and delayed confirmations
- Can the admin team resolve a dispute with complete auditability

### Avoid overengineering

- Do not launch with a token.
- Do not build a full marketplace before nailing payments and trust.
- Do not put chat, document storage, or evidence search onchain.
- Do not introduce upgradeability into funds-bearing escrow vaults unless absolutely necessary.

## Sources

- Base Account Overview: https://docs.base.org/base-account/overview/what-is-base-account
- Base Paymaster / gasless transactions: https://docs.base.org/cookbook/go-gasless
- Base subscriptions / recurring payments: https://docs.base.org/base-account/guides/accept-recurring-payments
- Ethereum L2 overview: https://ethereum.org/layer-2/learn/
- Solana fee structure: https://solana.com/docs/core/fees/fee-structure
- Aptos developer docs: https://aptos.dev/
- Flow developer portal: https://developers.flow.com/
- Sui documentation: https://docs.sui.io/
- Coinbase Onramp overview: https://docs.cdp.coinbase.com/onramp/coinbase-hosted-onramp/overview
- Privy wallets overview: https://docs.privy.io/wallets/overview
- The Graph quick start: https://thegraph.com/docs/en/subgraphs/quick-start/
- OpenZeppelin upgrades docs: https://docs.openzeppelin.com/upgrades/
