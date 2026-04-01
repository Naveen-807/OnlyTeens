import "server-only";

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { CONTRACTS, POLICY_ABI, SEPOLIA } from "@/lib/constants";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import {
  assertLiveDependency,
  isEmergencyFallbackEnabled,
  isLiveMode,
} from "@/lib/runtime/liveMode";
import { normalizePrivateKeyEnv } from "@/lib/runtime/privateKey";
import { getFhevmInstance } from "@/lib/zama/client";
import {
  serverDecryptLatestDecision,
  serverDecryptPolicy,
} from "@/lib/zama/decrypt";
import type { PolicyDecision } from "@/lib/types";

function decisionFromUint8(value: number): PolicyDecision {
  return (["GREEN", "YELLOW", "RED", "BLOCKED"][value] ||
    "BLOCKED") as PolicyDecision;
}

function getEvaluatorAccount() {
  const envName = process.env.ZAMA_EVALUATOR_PRIVATE_KEY
    ? "ZAMA_EVALUATOR_PRIVATE_KEY"
    : process.env.ZAMA_PRIVATE_KEY
      ? "ZAMA_PRIVATE_KEY"
      : "";
  const key = process.env.ZAMA_EVALUATOR_PRIVATE_KEY || process.env.ZAMA_PRIVATE_KEY;
  if (!key) return null;
  return privateKeyToAccount(normalizePrivateKeyEnv(envName, key));
}

function getPolicyViewerAccount() {
  const envName = process.env.DEPLOYER_PRIVATE_KEY
    ? "DEPLOYER_PRIVATE_KEY"
    : process.env.ZAMA_EVALUATOR_PRIVATE_KEY
      ? "ZAMA_EVALUATOR_PRIVATE_KEY"
      : process.env.ZAMA_PRIVATE_KEY
        ? "ZAMA_PRIVATE_KEY"
        : "";
  const key =
    process.env.DEPLOYER_PRIVATE_KEY ||
    process.env.ZAMA_EVALUATOR_PRIVATE_KEY ||
    process.env.ZAMA_PRIVATE_KEY;
  if (!key) return null;
  return privateKeyToAccount(normalizePrivateKeyEnv(envName, key));
}

function getSepoliaWalletClient() {
  const rpcUrl = SEPOLIA.rpcUrls.default.http[0];
  return createWalletClient({
    chain: SEPOLIA,
    transport: http(rpcUrl),
  });
}

function isPolicyBroadcastFailure(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message} ${error.cause ? String(error.cause) : ""}`
      : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("insufficient funds") ||
    normalized.includes("insufficient balance") ||
    normalized.includes("not enough funds") ||
    normalized.includes("balance of the account") ||
    normalized.includes("exceeds the balance") ||
    normalized.includes("fee + value")
  );
}

function isZamaProviderFailure(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message} ${error.cause ? String(error.cause) : ""}`
      : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("provider returned error") ||
    normalized.includes("429") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("fetch failed") ||
    normalized.includes("gateway") ||
    normalized.includes("enotfound") ||
    normalized.includes("econnreset") ||
    normalized.includes("etimedout")
  );
}

function computeDecision(params: {
  amount: number;
  passportLevel: number;
  isRecurring: boolean;
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
  riskFlags: number;
}): PolicyDecision {
  if (params.amount <= 0) return "BLOCKED";
  if (params.riskFlags !== 0) return "BLOCKED";

  const cap = params.isRecurring
    ? params.recurringMonthlyCap
    : params.singleActionCap;

  if (params.amount > cap) return "RED";
  if (params.passportLevel >= params.trustUnlockThreshold) return "GREEN";
  return "YELLOW";
}

export async function submitEncryptedPolicy(params: {
  familyId: `0x${string}` | string;
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
  riskFlags: number;
  teenAddress: `0x${string}`;
  guardianAccount?: any;
}): Promise<{ txHash: string }> {
  assertContractConfigForDemo();
  const account = params.guardianAccount ?? getEvaluatorAccount();
  if (!account) {
    throw new Error("POLICY_UNAVAILABLE:Missing evaluator account for policy set");
  }

  const fhevm = await getFhevmInstance();
  const walletClient = getSepoliaWalletClient();

  const input = fhevm.createEncryptedInput(CONTRACTS.policy, account.address);
  input.add64(params.singleActionCap);
  input.add64(params.recurringMonthlyCap);
  input.add8(params.trustUnlockThreshold);
  input.add8(params.riskFlags);
  const encrypted = input.encrypt();

  const txHash = await walletClient.writeContract({
    account,
    address: CONTRACTS.policy,
    abi: POLICY_ABI,
    functionName: "setPolicy",
    args: [
      params.familyId as `0x${string}`,
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.handles[2],
      encrypted.handles[3],
      encrypted.inputProof,
    ],
  });

  return { txHash };
}

export async function evaluateAction(params: {
  familyId: `0x${string}` | string;
  teenAddress: `0x${string}` | string;
  amount: number;
  passportLevel: number;
  isRecurring: boolean;
  account?: any;
  requireEncrypted?: boolean; // Retained for compatibility; strict runtime mode still governs fallback.
}): Promise<{ decision: PolicyDecision; txHash: string; source: "encrypted" | "heuristic" }> {
  assertContractConfigForDemo();
  const strictEvaluation = isDemoStrictMode() || (isLiveMode() && !isEmergencyFallbackEnabled());
  const account = params.account ?? getEvaluatorAccount();
  assertLiveDependency(
    Boolean(account),
    "LIVE_POLICY_UNAVAILABLE",
    "Missing evaluator account for encrypted policy evaluation",
  );
  if (!account) {
    if (strictEvaluation) {
      throw new Error(
        "LIVE_POLICY_UNAVAILABLE:Missing evaluator account for encrypted policy evaluation",
      );
    }
    console.warn("[Zama] No evaluator account - using heuristic fallback");
    return {
      decision: params.isRecurring ? "YELLOW" : "GREEN",
      txHash: "",
      source: "heuristic",
    };
  }

  const walletClient = getSepoliaWalletClient();

  let txHash = "";
  let broadcastFailed = false;
  let providerFailed = false;
  try {
    txHash = await walletClient.writeContract({
      account,
      address: CONTRACTS.policy,
      abi: POLICY_ABI,
      functionName: "evaluateAction",
      args: [
        params.familyId as `0x${string}`,
        params.teenAddress as `0x${string}`,
        BigInt(params.amount),
        params.passportLevel,
        params.isRecurring,
      ],
    });
  } catch (error) {
    if (strictEvaluation && !isPolicyBroadcastFailure(error)) {
      throw error;
    }
    broadcastFailed = true;
    const failureLabel = isPolicyBroadcastFailure(error)
      ? "policy evaluation could not be funded"
      : "policy evaluation transaction failed";
    console.warn(`[Zama] ${failureLabel} - using fallback:`, error);
  }

  let decision: PolicyDecision = params.isRecurring ? "YELLOW" : "GREEN";
  let source: "encrypted" | "heuristic" = "heuristic";
  const viewer = getPolicyViewerAccount();

  if (viewer) {
    try {
      if (txHash) {
        const latestDecision = await serverDecryptLatestDecision({
          familyId: params.familyId,
          viewerSigner: viewer,
        });

        decision = decisionFromUint8(latestDecision.decision);
        source = "encrypted";
      } else {
        const policy = await serverDecryptPolicy({
          familyId: params.familyId,
          viewerSigner: viewer,
        });

        decision = computeDecision({
          amount: params.amount,
          passportLevel: params.passportLevel,
          isRecurring: params.isRecurring,
          singleActionCap: policy.singleActionCap,
          recurringMonthlyCap: policy.recurringMonthlyCap,
          trustUnlockThreshold: policy.trustUnlockThreshold,
          riskFlags: policy.riskFlags,
        });
        source = "heuristic";
        console.warn("[Zama] Using local policy computation as fallback");
      }
    } catch (latestDecisionError) {
      console.warn("[Zama] Failed to decrypt latest decision:", latestDecisionError);
      providerFailed = isZamaProviderFailure(latestDecisionError);
      if (strictEvaluation && !broadcastFailed && !isZamaProviderFailure(latestDecisionError)) {
        assertLiveDependency(
          false,
          "LIVE_POLICY_UNAVAILABLE",
          `Encrypted policy decryption failed: ${String(latestDecisionError)}`,
        );
      }
      try {
        const policy = await serverDecryptPolicy({
          familyId: params.familyId,
          viewerSigner: viewer,
        });

        decision = computeDecision({
          amount: params.amount,
          passportLevel: params.passportLevel,
          isRecurring: params.isRecurring,
          singleActionCap: policy.singleActionCap,
          recurringMonthlyCap: policy.recurringMonthlyCap,
          trustUnlockThreshold: policy.trustUnlockThreshold,
          riskFlags: policy.riskFlags,
        });
        source = "heuristic";
        console.warn("[Zama] Using local policy computation as fallback");
      } catch (policyError) {
        providerFailed = providerFailed || isZamaProviderFailure(policyError);
        if (strictEvaluation && !broadcastFailed && !isZamaProviderFailure(policyError)) {
          assertLiveDependency(
            false,
            "LIVE_POLICY_UNAVAILABLE",
            `Policy decryption failed: ${String(policyError)}`,
          );
        }
        if (isDemoStrictMode() && strictEvaluation && !broadcastFailed && !isZamaProviderFailure(policyError)) {
          throw latestDecisionError;
        }
        console.warn("[Zama] Using default heuristic - all decryption failed");
      }
    }
  }

  if (strictEvaluation && !broadcastFailed && !providerFailed) {
    assertLiveDependency(
      source === "encrypted",
      "LIVE_POLICY_UNAVAILABLE",
      "Encrypted Zama evaluation is required for live execution",
    );
  }

  return { decision, txHash, source };
}
