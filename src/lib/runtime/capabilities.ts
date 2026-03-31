import "server-only";

import { CONTRACTS, FLOW_TESTNET, SAFE_EXECUTOR_CID } from "@/lib/constants";
import { getFlowRuntimeProfile } from "@/lib/flow/runtimeProfile";
import { getChipotleBaseUrl, isChipotleConfigured } from "@/lib/lit/chipotle";
import { getPermissions } from "@/lib/lit/permissions";
import { loadFamilies } from "@/lib/onboarding/familyService";
import { isDegradedModeAllowed, isLiveMode } from "@/lib/runtime/liveMode";
import { getVincentConfig, isVincentConfigured, isVincentLiveReady } from "@/lib/vincent/client";
import type { RuntimeCapabilities, RuntimeFamilyProof } from "@/lib/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isConfiguredAddress(value?: string): boolean {
  return Boolean(value && value.toLowerCase() !== ZERO_ADDRESS);
}

function pickFamily(familyId?: string) {
  const families = Object.values(loadFamilies())
    .filter((family) => family.active)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  if (!families.length) return null;
  if (!familyId) return families[0];
  return families.find((family) => family.familyId === familyId) || families[0];
}

function extractPermittedActions(raw: unknown): string[] {
  const serialized = JSON.stringify(raw || {});
  const matches = serialized.match(/Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{20,}/g);
  return Array.from(new Set(matches || []));
}

async function getFamilyProof(familyId?: string): Promise<RuntimeFamilyProof> {
  const family = pickFamily(familyId);

  if (!family) {
    return {
      available: false,
      source: "config-only",
      permittedScopes: ["guardian:SignAnything", "teen:PersonalSign", "calma:LitAction"],
      permissions: {
        fetched: false,
        authorized: false,
        permittedActions: [],
      },
    };
  }

  let permissions = {
    fetched: false,
    authorized: Boolean(family.litActionCid && SAFE_EXECUTOR_CID && family.litActionCid === SAFE_EXECUTOR_CID),
    permittedActions: family.litActionCid ? [family.litActionCid] : [],
    error: undefined as string | undefined,
  };

  if (family.clawrencePkpTokenId) {
    try {
      const rawPermissions = await getPermissions(family.clawrencePkpTokenId);
      const permittedActions = extractPermittedActions(rawPermissions);
      permissions = {
        fetched: true,
        authorized: Boolean(SAFE_EXECUTOR_CID && permittedActions.includes(SAFE_EXECUTOR_CID)),
        permittedActions,
        error: undefined,
      };
    } catch (error) {
      permissions = {
        ...permissions,
        fetched: false,
        error: error instanceof Error ? error.message : "Unable to fetch Lit permissions",
      };
    }
  }

  return {
    available: true,
    source: "live-family-record",
    familyId: family.familyId,
    createdAt: family.createdAt,
    guardianAddress: family.guardianAddress,
    teenAddress: family.teenAddress,
    calmaAddress: family.calmaAddress || family.clawrenceAddress,
    clawrenceAddress: family.clawrenceAddress,
    guardianPkpTokenId: family.guardianPkpTokenId,
    teenPkpTokenId: family.teenPkpTokenId,
    calmaPkpTokenId: family.calmaPkpTokenId || family.clawrencePkpTokenId,
    clawrencePkpTokenId: family.clawrencePkpTokenId,
    guardianPkpPublicKey: family.guardianPkpPublicKey,
    teenPkpPublicKey: family.teenPkpPublicKey,
    calmaPkpPublicKey: family.calmaPkpPublicKey || family.clawrencePkpPublicKey,
    clawrencePkpPublicKey: family.clawrencePkpPublicKey,
    litActionCid: family.litActionCid,
    litActionMatchesRuntimeCid: Boolean(
      family.litActionCid && SAFE_EXECUTOR_CID && family.litActionCid === SAFE_EXECUTOR_CID,
    ),
    chipotleAccountId: family.chipotleAccountId,
    chipotlePrimaryGroupId: family.chipotleGroupId,
    chipotlePrimaryUsageKeyId: family.chipotleUsageKeyId,
    chipotlePrimaryCalmaWalletId:
      family.chipotleCalmaWalletId || family.chipotleClawrenceWalletId,
    chipotlePrimaryPkpId: family.chipotleClawrenceWalletId,
    vincentWalletAddress: family.vincentWalletAddress,
    vincentWalletId: family.vincentWalletId,
    vincentAppId: family.vincentAppId,
    vincentAppVersion: family.vincentAppVersion,
    vincentUserAccount: family.vincentUserAccount,
    vincentJwtAuthenticated: family.vincentJwtAuthenticated,
    executionMode: family.executionMode,
    executionLaneModes:
      family.executionLaneModes || ["direct-flow", "agent-assisted-flow", "guardian-autopilot-flow"],
    fallbackActive: family.fallbackActive,
    flowMedium: family.flowMedium || "FLOW",
    guardianAutopilotEnabled: Boolean(family.guardianAutopilotEnabled),
    erc8004: family.erc8004AgentId
      ? {
          chainId: Number(process.env.ERC8004_CHAIN_ID || 11155111),
          agentId: family.erc8004AgentId,
          identityTxHash: family.erc8004IdentityTxHash,
          reputationTxHashes: family.erc8004ReputationTxHashes,
          validationTxHashes: family.erc8004ValidationTxHashes,
          registry: {
            identity: process.env.ERC8004_IDENTITY_REGISTRY_ADDRESS || "",
            reputation: process.env.ERC8004_REPUTATION_REGISTRY_ADDRESS || "",
            validation: process.env.ERC8004_VALIDATION_REGISTRY_ADDRESS || "",
          },
        }
      : undefined,
    permittedScopes: ["guardian:SignAnything", "teen:PersonalSign", "calma:LitAction"],
    permissions,
  };
}

export async function getRuntimeCapabilities(familyId?: string): Promise<RuntimeCapabilities> {
  const familyProof = await getFamilyProof(familyId);
  const flowRuntime = getFlowRuntimeProfile();
  const vincentConfig = getVincentConfig();
  const vincentLive = isVincentLiveReady();
  const chipotleLive = isChipotleConfigured();

  const flowCore =
    isConfiguredAddress(CONTRACTS.access) &&
    isConfiguredAddress(CONTRACTS.vault) &&
    isConfiguredAddress(CONTRACTS.scheduler) &&
    isConfiguredAddress(CONTRACTS.passport);

  const zamaCore = isConfiguredAddress(CONTRACTS.policy) && Boolean(
    process.env.ZAMA_EVALUATOR_PRIVATE_KEY || process.env.ZAMA_PRIVATE_KEY,
  );

  const litDelegation =
    Boolean(SAFE_EXECUTOR_CID) &&
    familyProof.available &&
    Boolean(familyProof.litActionMatchesRuntimeCid) &&
    familyProof.permissions.authorized;

  familyProof.walletMode = flowRuntime.walletMode;
  familyProof.gasMode = flowRuntime.gasMode;
  familyProof.flowMedium = "FLOW";
  familyProof.schedulerBackend = flowRuntime.schedulerBackend;
  familyProof.flowNativeFeaturesUsed = flowRuntime.flowNativeFeaturesUsed;

  return {
    generatedAt: new Date().toISOString(),
    liveMode: {
      enabled: isLiveMode(),
      degradedModeAllowed: isDegradedModeAllowed(),
    },
    vincent: {
      mode: vincentLive ? "live" : "local-only",
      baseUrl: vincentConfig.baseUrl,
      note: vincentLive
        ? "Vincent live mode is configured; Calma can use Vincent Connect auth and agent-wallet context."
        : "Vincent live mode is not configured; the app will surface fallback execution clearly.",
      appId: vincentConfig.appId,
      appVersion: vincentConfig.appVersion,
      redirectUri: vincentConfig.redirectUri,
      jwtAudience: vincentConfig.jwtAudience,
    },
    lit: {
      network: "Lit Chipotle",
      baseUrl: getChipotleBaseUrl(),
      safeExecutorCid: SAFE_EXECUTOR_CID,
      configured: Boolean(SAFE_EXECUTOR_CID) && (chipotleLive || familyProof.available),
      familyProof,
    },
    zama: {
      network: "Ethereum Sepolia",
      policyContract: CONTRACTS.policy,
      evaluatorConfigured: Boolean(process.env.ZAMA_EVALUATOR_PRIVATE_KEY || process.env.ZAMA_PRIVATE_KEY),
      note: "Confidential policy executes on Sepolia; the app must label encrypted vs heuristic decisions explicitly.",
    },
    flow: {
      network: FLOW_TESTNET.name,
      chainId: FLOW_TESTNET.id,
      accessContract: CONTRACTS.access,
      vaultContract: CONTRACTS.vault,
      schedulerContract: CONTRACTS.scheduler,
      passportContract: CONTRACTS.passport,
      gaslessRpcUrl: process.env.GAS_FREE_RPC_URL || FLOW_TESTNET.rpcUrls.default.http[0],
      gasMode: flowRuntime.gasMode,
      walletMode: flowRuntime.walletMode,
      flowMedium: "FLOW",
      preferredSchedulerBackend: flowRuntime.schedulerBackend,
      nativeSchedulingConfigured: flowRuntime.nativeSchedulingConfigured,
      flowNativeFeaturesUsed: flowRuntime.flowNativeFeaturesUsed,
    },
    executionLanes: ["direct-flow", "agent-assisted-flow", "guardian-autopilot-flow"],
    autopilot: {
      guardianAutopilotEnabled: Boolean(familyProof.guardianAutopilotEnabled),
      teenAutonomyAllowed: false,
      schedulerBackend: flowRuntime.schedulerBackend,
    },
    sponsorReadiness: {
      flowCore,
      zamaCore,
      litDelegation,
    },
    erc8004: {
      enabled: Boolean(
        process.env.ERC8004_IDENTITY_REGISTRY_ADDRESS &&
          process.env.ERC8004_REPUTATION_REGISTRY_ADDRESS &&
          process.env.ERC8004_VALIDATION_REGISTRY_ADDRESS,
      ),
      chainId: Number(process.env.ERC8004_CHAIN_ID || 11155111),
      identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY_ADDRESS || "",
      reputationRegistry: process.env.ERC8004_REPUTATION_REGISTRY_ADDRESS || "",
      validationRegistry: process.env.ERC8004_VALIDATION_REGISTRY_ADDRESS || "",
      note: "ERC-8004 agent identity, reputation, and validation receipts for Calma.",
    },
  };
}
