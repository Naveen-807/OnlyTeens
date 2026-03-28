# LockIn Delivery Roadmap

## Architecture diagram explanation

The system should be treated as five connected layers:

1. `Experience layer`
   Next.js web app for marketing, onboarding, dashboarding, deal management, and admin tooling.
2. `Application layer`
   NestJS API enforcing auth, workspace permissions, deal lifecycle, notifications, and treasury rules.
3. `Projection and jobs layer`
   Postgres for source-of-truth application state, Redis/BullMQ for asynchronous orchestration, and an indexer for onchain event projection.
4. `Blockchain layer`
   Base smart contracts for escrow, release, fees, and dispute resolution.
5. `External services layer`
   Wallet/auth provider, blockchain RPC/webhooks, fiat onramp, object storage, email, analytics, and monitoring.

## Monorepo structure

```text
lockin/
  apps/
    web/
      app/
      components/
      features/
      lib/
      styles/
    api/
      src/
        modules/
        common/
        config/
    worker/
      src/
        jobs/
        consumers/
        schedulers/
    indexer/
      src/
        chains/
        projections/
        backfill/
        webhooks/
  packages/
    contracts/
      src/
      script/
      test/
      abi/
    db/
      prisma/
      src/
    sdk/
      src/
    ui/
      src/
    config/
      eslint/
      typescript/
    observability/
      src/
  infra/
    docker/
    terraform/
    railway/
    vercel/
  docs/
  .github/
```

## Frontend pages and components

### Marketing and conversion

- `/`
  Premium landing page with clear problem framing, proof points, and CTA into escrow creation.
- `/how-it-works`
  Step-by-step explanation for buyers and freelancers.
- `/pricing`
  Escrow fee tiers, retainer tiers, enterprise plan.
- `/security`
  Contract audit status, custody model, monitoring, legal posture.

### Auth and onboarding

- `/sign-in`
- `/onboarding`
- `/wallets/connect`
- `/funding/onramp`

### App routes

- `/dashboard`
  Summary KPIs, active deals, pending releases, treasury balance.
- `/deals`
  Searchable deal table with filters by state, counterparty, and network.
- `/deals/new`
  Multi-step deal creation wizard.
- `/deals/[dealId]`
  Timeline, milestones, evidence, onchain states, release actions.
- `/retainers`
  Subscription overview, spend limits, charge history.
- `/portfolio`
  Funds in escrow, released funds, fee spend, inflows and outflows.
- `/activity`
  Unified event feed from app actions and chain confirmations.
- `/settings/profile`
- `/settings/security`
- `/settings/notifications`
- `/admin/disputes`
- `/admin/treasury`
- `/admin/ops`

### Shared component set

- `DealStateBadge`
- `MilestoneTimeline`
- `FundingStatusCard`
- `ExplorerLink`
- `WalletSummary`
- `RiskBanner`
- `TransactionDrawer`
- `DisputePanel`
- `TreasuryChart`
- `ActivityFeed`

## Backend modules

### Domain modules

- `auth`
- `users`
- `wallets`
- `organizations`
- `deals`
- `milestones`
- `escrow`
- `subscriptions`
- `disputes`
- `evidence`
- `notifications`
- `portfolio`
- `admin`
- `audit`
- `risk`

### Infrastructure modules

- `prisma`
- `redis`
- `bullmq`
- `blockchain`
- `webhooks`
- `storage`
- `telemetry`

## Smart contract modules

### `EscrowFactory.sol`

- Creates new deal vaults
- Stores implementation references
- Emits `DealCreated`
- Supports protocol fee config lookups

### `EscrowVault.sol`

- Stores buyer, seller, token, milestones, deadlines
- Accepts funding in USDC
- Supports partial releases
- Supports deadline-based refunds where applicable
- Supports dispute escalation
- Emits all lifecycle events needed for indexing

### `DisputeResolver.sol`

- Only authorized arbitrator or governance executor resolves disputes
- Supports split settlements
- Emits `DisputeResolved`

### `FeeTreasury.sol`

- Receives protocol fees
- Routes to treasury and optional referrers
- Emits `FeeCollected`

### Optional `CompletionAttestor.sol`

- Emits completion or reputation events if you do not use an external attestation layer

## Database schema outline

### Core identity tables

- `users`
  `id`, `email`, `display_name`, `privy_user_id`, `created_at`
- `wallet_accounts`
  `id`, `user_id`, `address`, `chain_id`, `wallet_type`, `is_embedded`, `linked_at`
- `organizations`
  `id`, `name`, `type`, `owner_user_id`, `created_at`
- `organization_members`
  `organization_id`, `user_id`, `role`

### Deal tables

- `deals`
  `id`, `organization_id`, `counterparty_org_id`, `title`, `status`, `chain_id`, `token_address`, `escrow_contract`, `buyer_wallet`, `seller_wallet`, `total_amount`, `funded_amount`, `created_by`, `created_at`
- `milestones`
  `id`, `deal_id`, `index`, `title`, `description`, `amount`, `due_at`, `status`, `release_requested_at`, `released_at`
- `deal_evidence`
  `id`, `deal_id`, `milestone_id`, `uploaded_by`, `storage_key`, `sha256`, `created_at`

### Onchain projection tables

- `onchain_transactions`
  `id`, `chain_id`, `tx_hash`, `from_address`, `to_address`, `method`, `status`, `block_number`, `confirmed_at`, `metadata_json`
- `contract_events`
  `id`, `chain_id`, `contract_address`, `block_number`, `log_index`, `event_name`, `tx_hash`, `payload_json`, `processed_at`
- `projection_cursors`
  `stream_name`, `last_block`, `last_tx_hash`, `updated_at`

### Finance tables

- `escrow_fundings`
  `id`, `deal_id`, `tx_hash`, `amount`, `token_address`, `funded_by`, `confirmed_at`
- `releases`
  `id`, `deal_id`, `milestone_id`, `tx_hash`, `gross_amount`, `fee_amount`, `net_amount`, `released_to`, `released_at`
- `protocol_fees`
  `id`, `deal_id`, `release_id`, `tx_hash`, `amount`, `recipient`, `created_at`
- `subscriptions`
  `id`, `organization_id`, `payer_wallet`, `recipient_wallet`, `provider`, `external_subscription_id`, `status`, `period_days`, `max_amount`, `created_at`
- `subscription_charges`
  `id`, `subscription_id`, `tx_hash`, `amount`, `status`, `charged_at`

### Risk and operations

- `disputes`
  `id`, `deal_id`, `opened_by`, `reason_code`, `status`, `opened_at`, `resolved_at`, `resolution_json`
- `dispute_messages`
  `id`, `dispute_id`, `author_user_id`, `message`, `created_at`
- `risk_flags`
  `id`, `entity_type`, `entity_id`, `severity`, `rule_code`, `status`, `details_json`, `created_at`
- `notifications`
  `id`, `user_id`, `type`, `channel`, `status`, `payload_json`, `sent_at`
- `audit_logs`
  `id`, `actor_type`, `actor_id`, `action`, `resource_type`, `resource_id`, `metadata_json`, `created_at`

## API design

### Auth

- `POST /v1/auth/nonce`
- `POST /v1/auth/verify-wallet`
- `POST /v1/auth/verify-privy`
- `POST /v1/auth/refresh`
- `GET /v1/auth/me`

### Organizations and wallets

- `POST /v1/organizations`
- `POST /v1/organizations/:id/invite`
- `GET /v1/organizations/:id/members`
- `POST /v1/wallets/link`
- `DELETE /v1/wallets/:walletId`

### Deals and milestones

- `POST /v1/deals`
- `GET /v1/deals`
- `GET /v1/deals/:dealId`
- `POST /v1/deals/:dealId/accept`
- `POST /v1/deals/:dealId/funding-intent`
- `POST /v1/deals/:dealId/milestones`
- `POST /v1/deals/:dealId/milestones/:milestoneId/evidence`
- `POST /v1/deals/:dealId/milestones/:milestoneId/request-release`
- `POST /v1/deals/:dealId/milestones/:milestoneId/approve-release`
- `POST /v1/deals/:dealId/milestones/:milestoneId/dispute`

### Subscriptions and retainers

- `POST /v1/subscriptions`
- `GET /v1/subscriptions`
- `POST /v1/subscriptions/:id/charge`
- `POST /v1/subscriptions/:id/revoke`

### Portfolio and analytics

- `GET /v1/portfolio/summary`
- `GET /v1/activity`
- `GET /v1/treasury/fees`
- `GET /v1/admin/metrics`

### Webhooks

- `POST /v1/webhooks/alchemy`
- `POST /v1/webhooks/onramp`
- `POST /v1/webhooks/privy`

## Wallet integration flow

### Sign-in

1. Frontend starts Privy login or wallet connect.
2. Frontend sends resulting auth artifact to backend.
3. Backend verifies authenticity and issues app session.
4. Backend upserts user, wallet, and organization membership.

### Funding

1. Frontend requests `funding-intent`.
2. Backend computes deterministic contract params and stores a pending record.
3. Frontend executes wallet action or redirects to Onramp.
4. Chain confirms transaction.
5. Indexer projects the result.
6. UI updates from backend projection.

### Release

1. Seller requests release.
2. Buyer signs release approval.
3. Contract emits release event.
4. Backend marks milestone settled and computes fee projection.

## Deployment plan

### Order of deployment

1. Provision Postgres, Redis, object storage, and secret manager.
2. Deploy RPC/webhook credentials and monitoring stack.
3. Deploy contracts to Base Sepolia.
4. Deploy indexer and worker against testnet.
5. Deploy backend API.
6. Deploy frontend.
7. Run end-to-end funding, release, refund, and dispute tests.
8. Promote contracts and services to Base mainnet.

### Environment split

- `local`
  Foundry local + mocked external providers only where local-only infra is unavoidable.
- `testnet`
  Base Sepolia, real wallets, real paymaster, real indexing.
- `production`
  Base mainnet, managed infra, real treasury wallets, hardened alerting.

## MVP scope

- Email/passkey onboarding
- External wallet connect
- Create and fund deal in USDC
- Milestone submission and release
- Event-indexed activity feed
- Admin dispute open and resolve flow
- Coinbase-hosted onramp
- Notifications and audit logs

## V1 scope

- Retainers with Base subscriptions
- Embedded wallet default path
- Reputation and completion attestations
- Treasury analytics and exports
- Safer admin permissions and support tooling
- Public API for partner integrations

## Advanced features

- Invoice factoring and receivables financing
- AI-assisted milestone risk scoring
- Country-aware off-ramp orchestration
- Escrow templates by service category
- Counterparty trust graph and verified delivery history

## Milestones

### Phase 0: discovery and threat model

- Finalize use case
- Write contract invariants
- Define dispute policy
- Define custody and treasury rules

### Phase 1: chain and contract foundation

- Implement escrow contracts
- Write tests and invariants
- Deploy to Base Sepolia

### Phase 2: backend and indexing

- Build auth, deals, escrow, and projection modules
- Implement webhook intake and reorg-safe projector

### Phase 3: buyer and seller UX

- Deliver funding and release flows
- Add evidence upload and activity timeline

### Phase 4: operations and trust

- Admin dispute console
- Treasury dashboard
- Notifications
- Audit logs

### Phase 5: retainers and growth loops

- Add recurring billing
- Add reputation artifacts
- Add referral and partner APIs

## Future enhancements

- Embedded compliance workflows for regulated markets
- Multi-chain settlement expansion using the same Base-first identity layer
- Escrow APIs for marketplaces, staffing firms, and B2B procurement tools
- Revenue-based financing on top of verified receivables
