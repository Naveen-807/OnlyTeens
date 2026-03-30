
> A teen-first financial platform where money moves on **Flow**, 
> permissions are enforced by **Lit Protocol**, family rules stay 
> confidential with **Zama FHE**, and every action produces a 
> tamper-proof receipt on **Storacha**.

## 🎯 Problem

400M+ Indian teens have no financial products designed for them.
Existing solutions are either too open (no parental control) or 
too locked (no teen autonomy). Proof18 bridges this gap with
**progressive financial freedom under AI-guided supervision**.

## 🏗 Architecture

- Full spec: `PROOF18_COMPLETE_PROJECT_LOGIC_DOCUMENT.md`
- Obsidian skill bundle: `plugins/obsidian-skills/README.md`
- Obsidian notes: `obsidian-notes/00 - Proof18 Index.md`

## ⚙️ Setup (Strict Demo Mode)

1. Copy `.env.example` to `.env.local` and fill all non-placeholder values.
2. Set `DEMO_STRICT_MODE=true`.
3. Ensure all contract addresses are non-zero in `deployments.json` and/or env vars.
4. Run:

```bash
npm run bootstrap
```

This runs `npm ci` + strict preflight checks (RPC reachability, non-zero contracts, Lit CID, Storacha creds, Zama evaluator key presence).

## ✅ Verification Commands

```bash
npm run verify
npm run hardhat:test
npm run build
npm run preflight
```

`npm run verify` now runs the full local health gate: Hardhat tests, TypeScript typecheck, and Next.js build. `npm run preflight` is the stricter environment check for contract addresses, RPC reachability, Lit CID resolution, Storacha credentials, and Zama evaluator configuration.

## Demo Persistence

- `data/approvals.json`, `data/receipts.json`, and `data/families.json` are demo-only persistence layers so the hackathon flow survives process restarts.
- They are not production databases and should be replaced if this moves beyond the submission environment.
- Strict mode should still require real Flow, Lit, Zama, and Storacha configuration before the app will execute transactions.

## 🧪 Core Demo Flows (No Mock in Strict Mode)

1. Guardian + teen auth (Lit PKP sessions).
2. Family onboarding bootstrap (`/api/onboarding/family`).
3. Encrypted policy set + evaluate (`/api/policy/set`, `/api/policy/evaluate`).
4. Savings execute (`/api/savings/execute`) -> Flow tx + Storacha CID + passport update.
5. Subscription request -> guardian approve (`/api/subscription/request`, `/api/approval/approve`) -> Flow tx + Storacha CID + passport update.
6. Evidence list (`/api/receipts/list`) + approval list (`/api/approval/list`) expose stable `items` and `count`.
