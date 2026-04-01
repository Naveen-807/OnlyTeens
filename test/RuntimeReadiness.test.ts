import { expect } from "chai";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readText(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Runtime readiness helpers", function () {
  it("keeps shared API client helpers in place for consistent fetch behavior", function () {
    const apiClient = readText("src/lib/api/client.ts");

    expect(apiClient).to.include("export function extractApiError");
    expect(apiClient).to.include("export async function readJsonResponse");
    expect(apiClient).to.include("export async function fetchApi");
    expect(apiClient).to.include("export function hasRenderableLink");
    expect(apiClient).to.include("if (data.success === false)");
  });
});

describe("Runtime readiness surfaces", function () {
  it("keeps auth refresh failures explicit and activity screens guarded", function () {
    const authStore = readText("src/store/authStore.ts");
    const teenActivity = readText("src/app/teen/activity/page.tsx");
    const guardianActivity = readText("src/app/guardian/activity/page.tsx");

    expect(authStore).to.include("export interface RefreshStateResult");
    expect(authStore).to.not.include("silent refresh failure");
    expect(teenActivity).to.include("Complete onboarding to view activity");
    expect(teenActivity).to.include("hasRenderableLink");
    expect(guardianActivity).to.include("fetchApi");
    expect(guardianActivity).to.include("setError");
  });

  it("keeps the core teen action surfaces on shared fetch/error handling", function () {
    const savingsFlow = readText("src/components/SavingsFlow.tsx");
    const subscriptionFlow = readText("src/components/SubscriptionFlow.tsx");
    const inbox = readText("src/app/guardian/inbox/page.tsx");
    const chat = readText("src/components/ClawrenceChat.tsx");
    const chatRoute = readText("src/app/api/chat/route.ts");
    const engine = readText("src/lib/clawrence/engine.ts");

    expect(savingsFlow).to.include("setSubmitError");
    expect(savingsFlow).to.include("fetchJson");
    expect(subscriptionFlow).to.include("setSubmitError");
    expect(subscriptionFlow).to.include("fetchJson");
    expect(inbox).to.include("fetchApi");
    expect(chat).to.include("fetchJson");
    expect(chat).to.include('data.type === "error"');
    expect(chat).to.include("cachedPassport");
    expect(chat).to.include("cachedBalances");
    expect(chatRoute).to.include("Promise.allSettled");
    expect(chatRoute).to.include("cachedPassport");
    expect(chatRoute).to.include("cachedBalances");
    expect(chatRoute).to.include("defaultPassportState");
    expect(chatRoute).to.include("defaultBalances");
    expect(engine).to.include("fetch failed");
    expect(engine).to.include("socket hang up");
  });

  it("keeps generated Flow wallets funded before execution", function () {
    const walletSession = readText("src/lib/flow/walletSession.ts");
    const viemAccount = readText("src/lib/lit/viemAccount.ts");

    expect(walletSession).to.include("ensurePhoneWalletFunded");
    expect(walletSession).to.include("FLOW_PHONE_WALLET_TOP_UP_FLOW");
    expect(walletSession).to.include("flowPublicClient.getBalance");
    expect(walletSession).to.include("flowWalletClient.sendTransaction");
    expect(walletSession).to.include("fundingTxHash");
    expect(viemAccount).to.include("await getFlowWalletAccount");
  });

  it("enforces live-only execution semantics across runtime and orchestration layers", function () {
    const liveMode = readText("src/lib/runtime/liveMode.ts");
    const onboarding = readText("src/app/api/onboarding/family/route.ts");
    const savingsFlow = readText("src/lib/orchestration/savingsFlow.ts");
    const subscriptionFlow = readText("src/lib/orchestration/subscriptionFlow.ts");
    const executor = readText("src/lib/lit/executor.ts");
    const proofJudges = readText("src/app/api/proof/judges/route.ts");

    expect(liveMode).to.include("PROOF18_ENABLE_EMERGENCY_FALLBACK");
    expect(onboarding).to.include('executionMode: "vincent-live"');
    expect(onboarding).to.include('policyMode: "encrypted-live"');
    expect(onboarding).to.not.include('policyMode: "degraded"');
    expect(savingsFlow).to.include("requireEncrypted: true");
    expect(savingsFlow).to.not.include('executionMode: "local-fallback"');
    expect(subscriptionFlow).to.include("requireEncrypted: true");
    expect(subscriptionFlow).to.not.include('executionMode: "local-fallback"');
    expect(executor).to.include("LIVE_SIGNER_UNAVAILABLE");
    expect(proofJudges).to.not.include("Policy ran in degraded mode.");
  });

  it("keeps deployment and preflight checks anchored to real chain truth", function () {
    const deploymentArtifacts = readText("src/lib/runtime/deploymentArtifacts.ts");
    const preflight = readText("scripts/preflight.ts");
    const deployFlow = readText("scripts/deploy.cjs");
    const deployPolicy = readText("scripts/deployPolicy.cjs");

    expect(deploymentArtifacts).to.include("deployment-health.json");
    expect(preflight).to.include("assertContractBytecode");
    expect(preflight).to.include("Vincent auth surface reachable");
    expect(preflight).to.include("Deployment health artifact updated");
    expect(deployFlow).to.include("deployment-health.json");
    expect(deployFlow).to.include("deploymentTxHash");
    expect(deployPolicy).to.include("deployments.json updated with policy.");
    expect(deployPolicy).to.include("deployment-health.json updated with policy.");
  });
});
