import "server-only";

import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { uploadJSON } from "@/lib/storacha/client";
import type { PolicyDecision, Proof18Receipt } from "@/lib/types";

export async function storeReceipt(
  receipt: Proof18Receipt,
): Promise<{ cid: string; url: string }> {
  assertContractConfigForDemo();
  if (receipt.version !== "v1") {
    throw new Error("EVIDENCE_WRITE_FAILED:Unsupported receipt schema version");
  }
  const result = await uploadJSON(receipt);
  receipt.storachaCid = result.cid;
  return result;
}

export function buildSavingsReceipt(params: {
  familyId: string;
  teen: string;
  guardian: string;
  amount: string;
  decision: PolicyDecision;
  flowTxHash: string;
  passportBefore: number;
  passportAfter: number;
  totalActions: number;
  preExplanation: string;
  postExplanation: string;
  celebration?: string;
  zamaTxHash?: string;
}): Proof18Receipt {
  return {
    version: "v1",
    type: "savings",
    familyId: params.familyId,
    teen: params.teen,
    guardian: params.guardian,
    action: {
      description: `Savings deposit of ${params.amount} FLOW`,
      amount: params.amount,
      currency: "FLOW",
      isRecurring: false,
    },
    policy: {
      decision: params.decision,
      contractAddress: CONTRACTS.policy,
      evaluationTxHash: params.zamaTxHash,
    },
    execution: {
      litActionCid: SAFE_EXECUTOR_CID,
      litSigned: true,
      flowTxHash: params.flowTxHash,
      flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${params.flowTxHash}`,
    },
    passport: {
      levelBefore: params.passportBefore,
      levelAfter: params.passportAfter,
      leveledUp: params.passportAfter > params.passportBefore,
      totalActions: params.totalActions,
    },
    clawrence: {
      preExplanation: params.preExplanation,
      postExplanation: params.postExplanation,
      celebration: params.celebration,
    },
    timestamp: new Date().toISOString(),
  };
}

export function buildSubscriptionReceipt(params: {
  familyId: string;
  teen: string;
  guardian: string;
  serviceName: string;
  amount: string;
  decision: PolicyDecision;
  guardianApproved: boolean;
  guardianNote?: string;
  flowTxHash: string;
  passportBefore: number;
  passportAfter: number;
  totalActions: number;
  preExplanation: string;
  postExplanation: string;
  celebration?: string;
  approvalCid?: string;
  zamaTxHash?: string;
}): Proof18Receipt {
  return {
    version: "v1",
    type: "subscription",
    familyId: params.familyId,
    teen: params.teen,
    guardian: params.guardian,
    action: {
      description: `Monthly subscription: ${params.serviceName}`,
      amount: params.amount,
      currency: "FLOW",
      isRecurring: true,
      serviceName: params.serviceName,
    },
    policy: {
      decision: params.decision,
      contractAddress: CONTRACTS.policy,
      evaluationTxHash: params.zamaTxHash,
    },
    execution: {
      litActionCid: SAFE_EXECUTOR_CID,
      litSigned: true,
      flowTxHash: params.flowTxHash,
      flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${params.flowTxHash}`,
    },
    passport: {
      levelBefore: params.passportBefore,
      levelAfter: params.passportAfter,
      leveledUp: params.passportAfter > params.passportBefore,
      totalActions: params.totalActions,
    },
    clawrence: {
      preExplanation: params.preExplanation,
      postExplanation: params.postExplanation,
      celebration: params.celebration,
    },
    approvalRecord: {
      guardianApproved: params.guardianApproved,
      guardianNote: params.guardianNote,
      approvedAt: params.guardianApproved ? new Date().toISOString() : undefined,
      approvalStorachaCid: params.approvalCid,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function storePassportSnapshot(params: {
  familyId: string;
  teen: string;
  oldLevel: number;
  newLevel: number;
  triggeringAction: string;
  flowTxHash: string;
}): Promise<{ cid: string; url: string }> {
  return uploadJSON({
    type: "passport_update",
    ...params,
    timestamp: new Date().toISOString(),
  });
}

export async function storeConversationLog(params: {
  familyId: string;
  teen: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  actionsTriggered: number;
  flowTxHashes: string[];
  receiptCids: string[];
}): Promise<{ cid: string; url: string }> {
  return uploadJSON({
    type: "conversation_log",
    ...params,
    timestamp: new Date().toISOString(),
  });
}
