import { sponsoredSavingsDeposit } from "./flowGasless";
import { createWeeklySavings } from "./scheduler";
import { executeWithClawrence } from "./litExecutor";
import { getTeenViemAccount } from "./litViemAccount";
import { evaluateAction, submitEncryptedPolicy } from "./zamaClient";
import {
  storeSavingsReceipt,
  storeSubscriptionReceipt,
  storePassportSnapshot,
  storeApprovalRecord,
} from "./storachaReceipts";

// ════════════════════════════════════════════════
// FLOW A: Auto-Savings (GREEN path — no approval needed)
// ════════════════════════════════════════════════
export async function executeSavingsFlow(params: {
  familyId: string;
  teenPkpPublicKey: string;
  clawrencePublicKey: string;
  amount: string;
  passportLevel: number;
  sessionSigs: any;
  vaultAddress: `0x${string}`;
  schedulerAddress: `0x${string}`;
  zamaContractAddress: string;
}) {
  // Step 1: Zama evaluates encrypted policy
  const policyResult = await evaluateAction({
    familyId: params.familyId,
    amount: Number(params.amount),
    passportLevel: params.passportLevel,
    isRecurring: false,
    contractAddress: params.zamaContractAddress,
    teenSigner: null, // pass actual signer
  });

  const decision = "GREEN"; // From Zama event parsing

  // Step 2: Lit Action decides if signing is allowed
  const litResult = await executeWithClawrence({
    action: "savings",
    policyDecision: decision,
    guardianApproved: false, // Not needed for GREEN
    txData: new Uint8Array([]), // Serialized tx
    clawrencePublicKey: params.clawrencePublicKey,
    sessionSigs: params.sessionSigs,
  });

  if (!litResult.response.signed) {
    return { success: false, reason: litResult.response.reason };
  }

  // Step 3: Get teen's PKP Viem account
  const teenAccount = await getTeenViemAccount(
    params.teenPkpPublicKey,
    params.sessionSigs
  );

  // Step 4: Flow executes gasless savings deposit
  const flowResult = await sponsoredSavingsDeposit(
    teenAccount,
    params.vaultAddress,
    params.amount
  );

  // Step 5: Create recurring schedule
  const scheduleResult = await createWeeklySavings(
    teenAccount,
    params.schedulerAddress,
    BigInt(params.amount)
  );

  // Step 6: Storacha stores tamper-proof receipt
  const receipt = await storeSavingsReceipt({
    teen: teenAccount.address,
    guardian: "GUARDIAN_ADDRESS",
    familyId: params.familyId,
    amount: params.amount,
    policyDecision: decision,
    flowTxHash: flowResult.txHash,
    passportLevel: params.passportLevel,
    clawrenceExplanation:
      "Saving ₹500 weekly helps you reach your goal in 10 weeks. This is within your approved limits.",
  });

  // Step 7: Store passport snapshot
  const passportReceipt = await storePassportSnapshot({
    teen: teenAccount.address,
    familyId: params.familyId,
    oldLevel: params.passportLevel,
    newLevel: params.passportLevel + 1,
    triggeringAction: "Weekly savings setup",
    flowTxHash: flowResult.txHash,
  });

  return {
    success: true,
    decision: decision,
    flowTxHash: flowResult.txHash,
    flowExplorerUrl: flowResult.explorerUrl,
    receiptCid: receipt.cid,
    receiptUrl: receipt.url,
    passportCid: passportReceipt.cid,
    passportUrl: passportReceipt.url,
    scheduleTxHash: scheduleResult.txHash,
  };
}

// ════════════════════════════════════════════════
// FLOW B: Subscription Request (RED path — needs guardian approval)
// ════════════════════════════════════════════════
export async function executeSubscriptionFlow(params: {
  familyId: string;
  teenPkpPublicKey: string;
  clawrencePublicKey: string;
  serviceName: string;
  monthlyAmount: string;
  passportLevel: number;
  guardianApproved: boolean;
  sessionSigs: any;
  vaultAddress: `0x${string}`;
  schedulerAddress: `0x${string}`;
  zamaContractAddress: string;
}) {
  // Step 1: Zama evaluates → expects RED for subscription
  const decision = "RED";

  // Step 2: If not yet approved, return pending
  if (!params.guardianApproved) {
    // Store the pending request on Storacha
    const pendingReceipt = await storeApprovalRecord({
      familyId: params.familyId,
      guardian: "GUARDIAN_ADDRESS",
      teen: "TEEN_ADDRESS",
      actionDescription: `${params.serviceName} subscription ₹${params.monthlyAmount}/month`,
      approved: false,
      reason: "Awaiting guardian approval — exceeds encrypted recurring threshold",
    });

    return {
      success: false,
      status: "PENDING_APPROVAL",
      decision: decision,
      pendingReceiptCid: pendingReceipt.cid,
      pendingReceiptUrl: pendingReceipt.url,
    };
  }

  // Step 3: Guardian approved → Lit Action can now sign
  const litResult = await executeWithClawrence({
    action: "subscription",
    policyDecision: decision,
    guardianApproved: true,
    txData: new Uint8Array([]),
    clawrencePublicKey: params.clawrencePublicKey,
    sessionSigs: params.sessionSigs,
  });

  if (!litResult.response.signed) {
    return { success: false, reason: litResult.response.reason };
  }

  // Step 4: PKP Viem account
  const teenAccount = await getTeenViemAccount(
    params.teenPkpPublicKey,
    params.sessionSigs
  );

  // Step 5: Flow creates scheduled subscription
  const flowResult = await sponsoredSavingsDeposit(
    teenAccount,
    params.vaultAddress,
    params.monthlyAmount
  );

  // Step 6: Storacha receipt
  const receipt = await storeSubscriptionReceipt({
    teen: teenAccount.address,
    guardian: "GUARDIAN_ADDRESS",
    familyId: params.familyId,
    serviceName: params.serviceName,
    amount: params.monthlyAmount,
    policyDecision: decision,
    guardianApproved: true,
    flowTxHash: flowResult.txHash,
    passportLevel: params.passportLevel,
    clawrenceExplanation: `${params.serviceName} costs ₹${params.monthlyAmount}/month. Your guardian approved this subscription.`,
  });

  return {
    success: true,
    decision: decision,
    guardianApproved: true,
    flowTxHash: flowResult.txHash,
    flowExplorerUrl: flowResult.explorerUrl,
    receiptCid: receipt.cid,
    receiptUrl: receipt.url,
  };
}
