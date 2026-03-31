import "server-only";

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { CONTRACTS, POLICY_ABI, SEPOLIA } from "@/lib/constants";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { assertLiveMode } from "@/lib/runtime/liveMode";
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
  requireEncrypted?: boolean; // If true, will throw instead of using heuristic fallback
}): Promise<{ decision: PolicyDecision; txHash: string; source: "encrypted" | "heuristic" }> {
  assertContractConfigForDemo();
  const account = params.account ?? getEvaluatorAccount();
  assertLiveMode(
    Boolean(account),
    "POLICY_UNAVAILABLE:Missing evaluator account for encrypted policy evaluation",
  );
  if (!account) {
    if (isDemoStrictMode() || params.requireEncrypted) {
      throw new Error(
        "POLICY_UNAVAILABLE:Missing evaluator account for encrypted policy evaluation",
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

  const txHash = await walletClient.writeContract({
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

  let decision: PolicyDecision = params.isRecurring ? "YELLOW" : "GREEN";
  let source: "encrypted" | "heuristic" = "heuristic";
  const viewer = getPolicyViewerAccount();

  if (viewer) {
    try {
      const latestDecision = await serverDecryptLatestDecision({
        familyId: params.familyId,
        viewerSigner: viewer,
      });

      decision = decisionFromUint8(latestDecision.decision);
      source = "encrypted";
    } catch (latestDecisionError) {
      console.warn("[Zama] Failed to decrypt latest decision, trying policy fallback:", latestDecisionError);
      assertLiveMode(
        false,
        `POLICY_UNAVAILABLE:Encrypted policy decryption failed: ${String(latestDecisionError)}`,
      );
      if (params.requireEncrypted) {
        throw new Error(`POLICY_UNAVAILABLE:Encrypted policy decryption failed: ${latestDecisionError}`);
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
        assertLiveMode(
          false,
          `POLICY_UNAVAILABLE:Policy decryption failed: ${String(policyError)}`,
        );
        if (isDemoStrictMode() || params.requireEncrypted) {
          throw latestDecisionError;
        }
        console.warn("[Zama] Using default heuristic - all decryption failed");
      }
    }
  }

  return { decision, txHash, source };
}
