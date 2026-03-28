import { getStorachaClient } from "./storachaClient";

export interface Proof18Receipt {
  type: "savings" | "subscription" | "approval" | "passport_update";
  teen: string;
  guardian: string;
  familyId: string;
  action: {
    description: string;
    amount: string;
    currency: string;
  };
  policyDecision: "GREEN" | "YELLOW" | "RED" | "BLOCKED";
  guardianApproved: boolean;
  flowTxHash: string;
  flowExplorerUrl: string;
  litActionCid: string;
  litSigned: boolean;
  zamaContractAddress: string;
  passportLevel: number;
  timestamp: string;
  clawrenceExplanation: string;
}

// ─── Store a receipt and get CID ───
export async function storeReceipt(
  receipt: Proof18Receipt
): Promise<{ cid: string; url: string }> {
  const client = await getStorachaClient();

  // Create a JSON blob
  const blob = new Blob([JSON.stringify(receipt, null, 2)], {
    type: "application/json",
  });

  // Upload to Storacha → get content-addressed CID
  const cid = await client.uploadFile(blob);

  return {
    cid: cid.toString(),
    url: `https://storacha.link/ipfs/${cid.toString()}`,
  };
}

// ─── Store savings receipt ───
export async function storeSavingsReceipt(params: {
  teen: string;
  guardian: string;
  familyId: string;
  amount: string;
  policyDecision: string;
  flowTxHash: string;
  passportLevel: number;
  clawrenceExplanation: string;
}) {
  const receipt: Proof18Receipt = {
    type: "savings",
    teen: params.teen,
    guardian: params.guardian,
    familyId: params.familyId,
    action: {
      description: "Weekly auto-savings deposit",
      amount: params.amount,
      currency: "FLOW",
    },
    policyDecision: params.policyDecision as any,
    guardianApproved: params.policyDecision === "GREEN",
    flowTxHash: params.flowTxHash,
    flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${params.flowTxHash}`,
    litActionCid: process.env.SAFE_EXECUTOR_CID!,
    litSigned: true,
    zamaContractAddress: process.env.ZAMA_POLICY_ADDRESS!,
    passportLevel: params.passportLevel,
    timestamp: new Date().toISOString(),
    clawrenceExplanation: params.clawrenceExplanation,
  };

  return storeReceipt(receipt);
}

// ─── Store subscription receipt ───
export async function storeSubscriptionReceipt(params: {
  teen: string;
  guardian: string;
  familyId: string;
  serviceName: string;
  amount: string;
  policyDecision: string;
  guardianApproved: boolean;
  flowTxHash: string;
  passportLevel: number;
  clawrenceExplanation: string;
}) {
  const receipt: Proof18Receipt = {
    type: "subscription",
    teen: params.teen,
    guardian: params.guardian,
    familyId: params.familyId,
    action: {
      description: `Monthly subscription: ${params.serviceName}`,
      amount: params.amount,
      currency: "FLOW",
    },
    policyDecision: params.policyDecision as any,
    guardianApproved: params.guardianApproved,
    flowTxHash: params.flowTxHash,
    flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${params.flowTxHash}`,
    litActionCid: process.env.SAFE_EXECUTOR_CID!,
    litSigned: true,
    zamaContractAddress: process.env.ZAMA_POLICY_ADDRESS!,
    passportLevel: params.passportLevel,
    timestamp: new Date().toISOString(),
    clawrenceExplanation: params.clawrenceExplanation,
  };

  return storeReceipt(receipt);
}

// ─── Store guardian approval record ───
export async function storeApprovalRecord(params: {
  familyId: string;
  guardian: string;
  teen: string;
  actionDescription: string;
  approved: boolean;
  reason: string;
}) {
  const receipt: Proof18Receipt = {
    type: "approval",
    teen: params.teen,
    guardian: params.guardian,
    familyId: params.familyId,
    action: {
      description: params.actionDescription,
      amount: "0",
      currency: "FLOW",
    },
    policyDecision: params.approved ? "GREEN" : "RED",
    guardianApproved: params.approved,
    flowTxHash: "",
    flowExplorerUrl: "",
    litActionCid: "",
    litSigned: false,
    zamaContractAddress: process.env.ZAMA_POLICY_ADDRESS!,
    passportLevel: 0,
    timestamp: new Date().toISOString(),
    clawrenceExplanation: params.reason,
  };

  return storeReceipt(receipt);
}

// ─── Store Passport snapshot ───
export async function storePassportSnapshot(params: {
  teen: string;
  familyId: string;
  oldLevel: number;
  newLevel: number;
  triggeringAction: string;
  flowTxHash: string;
}) {
  const snapshot = {
    type: "passport_update",
    teen: params.teen,
    familyId: params.familyId,
    oldLevel: params.oldLevel,
    newLevel: params.newLevel,
    triggeringAction: params.triggeringAction,
    flowTxHash: params.flowTxHash,
    flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${params.flowTxHash}`,
    timestamp: new Date().toISOString(),
  };

  const client = await getStorachaClient();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const cid = await client.uploadFile(blob);

  return {
    cid: cid.toString(),
    url: `https://storacha.link/ipfs/${cid.toString()}`,
  };
}
