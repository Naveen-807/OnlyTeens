import "server-only";

import { createPublicClient, createWalletClient, decodeEventLog, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { CONTRACTS, POLICY_ABI, SEPOLIA } from "@/lib/constants";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { getFhevmInstance } from "@/lib/zama/client";
import type { PolicyDecision } from "@/lib/types";

function decisionFromUint8(value: number): PolicyDecision {
  return (["GREEN", "YELLOW", "RED", "BLOCKED"][value] ||
    "BLOCKED") as PolicyDecision;
}

function getEvaluatorAccount() {
  const key =
    process.env.ZAMA_EVALUATOR_PRIVATE_KEY || process.env.ZAMA_PRIVATE_KEY;
  if (!key) return null;
  return privateKeyToAccount(key as `0x${string}`);
}

function getSepoliaWalletClient() {
  const rpcUrl = SEPOLIA.rpcUrls.default.http[0];
  return createWalletClient({
    chain: SEPOLIA,
    transport: http(rpcUrl),
  });
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
  amount: number;
  passportLevel: number;
  isRecurring: boolean;
  account?: any;
}): Promise<{ decision: PolicyDecision; txHash: string }> {
  assertContractConfigForDemo();
  const account = params.account ?? getEvaluatorAccount();
  if (!account) {
    if (isDemoStrictMode()) {
      throw new Error(
        "POLICY_UNAVAILABLE:Missing evaluator account for encrypted policy evaluation",
      );
    }
    return {
      decision: params.isRecurring ? "YELLOW" : "GREEN",
      txHash: "",
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
      BigInt(params.amount),
      params.passportLevel,
      params.isRecurring,
    ],
  });

  const publicClient = createPublicClient({
    chain: SEPOLIA,
    transport: http(SEPOLIA.rpcUrls.default.http[0]),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  let decision: PolicyDecision = params.isRecurring ? "YELLOW" : "GREEN";
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: POLICY_ABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "PolicyEvaluated") {
        const raw = Number((decoded.args as any).decision);
        decision = decisionFromUint8(raw);
        break;
      }
    } catch {
      // ignore
    }
  }

  return { decision, txHash };
}
