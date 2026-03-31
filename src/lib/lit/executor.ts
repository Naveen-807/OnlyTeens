import "server-only";

import { createHash } from "node:crypto";

import { SAFE_EXECUTOR_CID } from "@/lib/constants";
import { executeChipotleAction, getChipotleBaseUrl, isChipotleConfigured } from "@/lib/lit/chipotle";
import { getFamilyById } from "@/lib/onboarding/familyService";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { assertLiveDependency } from "@/lib/runtime/liveMode";
import type { ActionType, ExecutionMode, PolicyDecision, UserSession } from "@/lib/types";

export interface ExecutorParams {
  action: ActionType;
  policyDecision: PolicyDecision;
  guardianApproved: boolean;
  amount: string;
  familyId: string;
  teenAddress?: `0x${string}`;
  txData: Uint8Array;
  clawrencePublicKey: string;
  session: UserSession;
  vincentGuardrailsPassed?: boolean;
}

export interface ExecutorResult {
  signed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  response: any;
  signatures?: any;
  layers?: string[];
  executionMode: ExecutionMode;
  fallbackActive: boolean;
  chipotle: {
    configured: boolean;
    accountId?: string;
    groupId?: string;
    pkpId?: string;
    walletId?: string;
    safeExecutorCid: string;
    usageKeyId?: string;
    usageKeyScope: "execute-only" | "local-fallback";
    mode: "live" | "local";
    baseUrl?: string;
  };
}

function createFallbackSignature(input: string): string {
  return `0x${createHash("sha256").update(input).digest("hex")}`;
}

function simulateSafeExecutor(params: {
  action: ActionType;
  policyDecision: PolicyDecision;
  guardianApproved: boolean;
  amount: string;
  familyId: string;
  vincentGuardrailsPassed: boolean;
  safeExecutorCid: string;
}) {
  if (params.policyDecision === "BLOCKED") {
    return {
      signed: false,
      reason: "BLOCKED by family policy. No execution permitted.",
      requiresApproval: false,
      response: {
        signed: false,
        reason: "BLOCKED by family policy. No execution permitted.",
        action: params.action,
        familyId: params.familyId,
        policyDecision: params.policyDecision,
        layer: "zama-policy",
      },
      layers: ["zama-policy"],
    };
  }

  if (!params.vincentGuardrailsPassed) {
    return {
      signed: false,
      reason: "Vincent guardrails rejected this action.",
      requiresApproval: false,
      response: {
        signed: false,
        reason: "Vincent guardrails rejected this action.",
        action: params.action,
        familyId: params.familyId,
        layer: "vincent-guardrails",
      },
      layers: ["vincent-guardrails"],
    };
  }

  if (params.policyDecision === "RED" && !params.guardianApproved) {
    return {
      signed: false,
      reason: "RED action requires guardian approval before execution.",
      requiresApproval: true,
      response: {
        signed: false,
        reason: "RED action requires guardian approval before execution.",
        action: params.action,
        familyId: params.familyId,
        policyDecision: params.policyDecision,
        requiresApproval: true,
      },
      layers: ["zama-policy", "lit-safe-executor"],
    };
  }

  if (params.policyDecision === "YELLOW" && !params.guardianApproved) {
    return {
      signed: false,
      reason: "YELLOW action needs guardian review.",
      requiresApproval: true,
      response: {
        signed: false,
        reason: "YELLOW action needs guardian review.",
        action: params.action,
        familyId: params.familyId,
        policyDecision: params.policyDecision,
        requiresApproval: true,
      },
      layers: ["zama-policy", "lit-safe-executor"],
    };
  }

  return {
    signed: true,
    requiresApproval: false,
    reason: undefined,
    response: {
      signed: true,
      action: params.action,
      familyId: params.familyId,
      policyDecision: params.policyDecision,
      guardianApproved: params.guardianApproved || params.policyDecision === "GREEN",
      amount: params.amount,
      safeExecutorCid: params.safeExecutorCid,
      signature: createFallbackSignature(
        JSON.stringify({
          action: params.action,
          familyId: params.familyId,
          amount: params.amount,
          policyDecision: params.policyDecision,
        }),
      ),
      layers: ["zama-policy", "vincent-guardrails", "lit-safe-executor"],
    },
    layers: ["zama-policy", "vincent-guardrails", "lit-safe-executor"],
  };
}

export async function executeSafeSigning(
  params: ExecutorParams,
): Promise<ExecutorResult> {
  assertContractConfigForDemo();
  if (!SAFE_EXECUTOR_CID) {
    throw new Error("MISSING_CONFIG:SAFE_EXECUTOR_CID is required for execution");
  }

  const family = getFamilyById(params.familyId);
  if (!family) {
    throw new Error(`FAMILY_NOT_FOUND:${params.familyId}`);
  }

  const selectedTeen =
    params.teenAddress && family.teenAddress.toLowerCase() !== params.teenAddress.toLowerCase()
      ? family.linkedTeens?.find(
          (teen) => teen.active && teen.teenAddress.toLowerCase() === params.teenAddress!.toLowerCase(),
        )
      : null;

  const chipotleMeta = {
    configured: isChipotleConfigured(),
    accountId: family.chipotleAccountId,
    groupId: selectedTeen?.chipotleGroupId || family.chipotleGroupId,
    pkpId: selectedTeen?.clawrenceChipotleWalletId || family.chipotleClawrenceWalletId,
    walletId: selectedTeen?.clawrenceChipotleWalletId || family.chipotleClawrenceWalletId,
    safeExecutorCid: SAFE_EXECUTOR_CID,
    usageKeyId: selectedTeen?.chipotleUsageKeyId || family.chipotleUsageKeyId,
    usageKeyScope: ((selectedTeen?.chipotleUsageApiKey || family.chipotleUsageApiKey)
      ? "execute-only"
      : "local-fallback") as "execute-only" | "local-fallback",
    mode: ((selectedTeen?.chipotleUsageApiKey || family.chipotleUsageApiKey)
      ? "live"
      : "local") as "live" | "local",
    baseUrl: getChipotleBaseUrl(),
  };

  const executionFamily = {
    ...family,
    chipotleGroupId: selectedTeen?.chipotleGroupId || family.chipotleGroupId,
    chipotleClawrenceWalletId:
      selectedTeen?.clawrenceChipotleWalletId || family.chipotleClawrenceWalletId,
    chipotleUsageKeyId: selectedTeen?.chipotleUsageKeyId || family.chipotleUsageKeyId,
    chipotleUsageApiKey: selectedTeen?.chipotleUsageApiKey || family.chipotleUsageApiKey,
  };

  if (isChipotleConfigured() && executionFamily.chipotleUsageApiKey) {
    const liveResult = await executeChipotleAction({
      family: executionFamily,
      jsParams: {
        action: params.action,
        policyDecision: params.policyDecision,
        guardianApproved: params.guardianApproved,
        amount: params.amount,
        familyId: params.familyId,
        teenAddress: params.teenAddress,
        txData: Array.from(params.txData),
        pkpId: executionFamily.chipotleClawrenceWalletId,
        publicKey: params.clawrencePublicKey,
        sigName: "proof18Sig",
        vincentGuardrailsPassed: params.vincentGuardrailsPassed ?? true,
      },
    });

    if (liveResult.success && liveResult.data) {
      const response =
        typeof liveResult.data.response === "string"
          ? JSON.parse(liveResult.data.response)
          : liveResult.data.response;

      return {
        signed: Boolean(response?.signed),
        reason: response?.reason,
        requiresApproval: response?.requiresApproval,
        response,
        signatures: response?.signature ? { proof18Sig: response.signature } : undefined,
        layers: response?.layers || ["lit-safe-executor"],
        executionMode: "vincent-live",
        fallbackActive: false,
        chipotle: chipotleMeta,
      };
    }
  }

  assertLiveDependency(
    false,
    "LIVE_SIGNER_UNAVAILABLE",
    "Lit Chipotle signing could not complete with a live usage key",
  );

  const fallback = simulateSafeExecutor({
    action: params.action,
    policyDecision: params.policyDecision,
    guardianApproved: params.guardianApproved,
    amount: params.amount,
    familyId: params.familyId,
    vincentGuardrailsPassed: params.vincentGuardrailsPassed ?? true,
    safeExecutorCid: SAFE_EXECUTOR_CID,
  });

  return {
    ...fallback,
    executionMode: family.chipotleAccountId ? "chipotle-fallback" : "local-fallback",
    fallbackActive: true,
    chipotle: chipotleMeta,
  };
}
