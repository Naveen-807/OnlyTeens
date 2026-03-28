import "server-only";

import { parseTransactionEvents } from "@/lib/flow/events";
import { getPassport, recordAction } from "@/lib/flow/passport";
import { createSubscriptionSchedule } from "@/lib/flow/scheduler";
import { fundSubscription } from "@/lib/flow/vault";
import { preActionExplanation, postDecisionExplanation, guardianExplanation, celebrationMessage } from "@/lib/clawrence/engine";
import { executeSafeSigning } from "@/lib/lit/executor";
import { getPkpAccount } from "@/lib/lit/viemAccount";
import { evaluateAction } from "@/lib/zama/policy";
import { uploadJSON } from "@/lib/storacha/client";
import {
  buildSubscriptionReceipt,
  storePassportSnapshot,
  storeReceipt,
} from "@/lib/storacha/receipts";
import type { ApprovalRequest, FlowResult, UserSession } from "@/lib/types";
import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants";

export async function requestSubscription(params: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: string;
  teenName: string;
  serviceName: string;
  monthlyAmount: string;
  clawrencePublicKey: string;
}): Promise<FlowResult & { approvalRequest?: ApprovalRequest }> {
  try {
    const passportState = await getPassport(params.familyId, params.teenAddress);

    const preExplanation = await preActionExplanation({
      teenName: params.teenName,
      action: "subscribe",
      description: `${params.serviceName} subscription`,
      amount: Number(params.monthlyAmount),
      currency: "₹",
      isRecurring: true,
      passportLevel: passportState.level,
      passportStreak: passportState.weeklyStreak,
    });

    const policyResult = await evaluateAction({
      familyId: params.familyId,
      amount: Math.round(Number(params.monthlyAmount) * 100),
      passportLevel: passportState.level,
      isRecurring: true,
    });

    const decision = policyResult.decision;

    const postExplanation = await postDecisionExplanation({
      teenName: params.teenName,
      action: "subscription",
      description: `${params.serviceName} ₹${params.monthlyAmount}/month`,
      amount: Number(params.monthlyAmount),
      currency: "₹",
      decision,
      passportLevel: passportState.level,
    });

    if (decision === "GREEN") {
      return await executeApprovedSubscription({
        session: params.session,
        familyId: params.familyId,
        teenAddress: params.teenAddress,
        guardianAddress: params.guardianAddress,
        teenName: params.teenName,
        serviceName: params.serviceName,
        monthlyAmount: params.monthlyAmount,
        clawrencePublicKey: params.clawrencePublicKey,
        decision,
        passportBefore: passportState,
        preExplanation,
        postExplanation,
        guardianApproved: true,
        guardianNote: "Auto-approved by policy (GREEN)",
        zamaTxHash: policyResult.txHash,
      });
    }

    if (decision === "BLOCKED") {
      return {
        success: false,
        decision,
        requiresApproval: false,
        clawrence: { preExplanation, postExplanation },
        error: "This subscription is blocked by family policy",
      };
    }

    const guardianExpl = await guardianExplanation({
      teenName: params.teenName,
      action: "subscription",
      description: `${params.serviceName} subscription`,
      amount: Number(params.monthlyAmount),
      currency: "₹",
      isRecurring: true,
      decision,
      passportLevel: passportState.level,
      passportStreak: passportState.weeklyStreak,
    });

    const pendingReceipt = await uploadJSON({
      type: "pending_approval",
      familyId: params.familyId,
      teen: params.teenAddress,
      action: "subscription",
      serviceName: params.serviceName,
      amount: params.monthlyAmount,
      decision,
      timestamp: new Date().toISOString(),
    });

    const approvalRequest: ApprovalRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      familyId: params.familyId,
      teenAddress: params.teenAddress,
      teenName: params.teenName,
      actionType: "subscription",
      description: `${params.serviceName} subscription ₹${params.monthlyAmount}/month`,
      amount: Number(params.monthlyAmount),
      currency: "₹",
      isRecurring: true,
      policyDecision: decision,
      clawrencePreExplanation: preExplanation,
      clawrenceGuardianExplanation: guardianExpl,
      teenPassportLevel: passportState.level,
      teenStreak: passportState.weeklyStreak,
      requestedAt: new Date().toISOString(),
      status: "pending",
      storachaCid: pendingReceipt.cid,
    };

    return {
      success: false,
      decision,
      requiresApproval: true,
      approvalRequestId: approvalRequest.id,
      approvalRequest,
      storacha: {
        receiptCid: pendingReceipt.cid,
        receiptUrl: pendingReceipt.url,
      },
      clawrence: { preExplanation, postExplanation },
    };
  } catch (error: any) {
    return {
      success: false,
      decision: "BLOCKED",
      requiresApproval: false,
      error: error?.message,
    };
  }
}

export async function executeApprovedSubscription(params: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: string;
  teenName: string;
  serviceName: string;
  monthlyAmount: string;
  clawrencePublicKey: string;
  decision: string;
  passportBefore: any;
  preExplanation: string;
  postExplanation: string;
  guardianApproved: boolean;
  guardianNote?: string;
  approvalCid?: string;
  zamaTxHash?: string;
}): Promise<FlowResult> {
  try {
    const litResult = await executeSafeSigning({
      action: "subscription",
      policyDecision: params.decision as any,
      guardianApproved: params.guardianApproved,
      amount: params.monthlyAmount,
      familyId: params.familyId,
      txData: new Uint8Array([]),
      clawrencePublicKey: params.clawrencePublicKey,
      sessionSigs: params.session.sessionSigs,
    });

    if (!litResult.signed) {
      return {
        success: false,
        decision: params.decision as any,
        requiresApproval: false,
        error: litResult.reason,
      };
    }

    const pkpAccount = await getPkpAccount(
      params.session.pkpPublicKey,
      params.session.sessionSigs,
    );

    const flowTx = await fundSubscription(
      pkpAccount,
      params.familyId,
      params.teenAddress,
      params.serviceName,
      params.monthlyAmount,
    );

    const amountWei = BigInt(Math.round(Number(params.monthlyAmount) * 1e18));
    await createSubscriptionSchedule(
      pkpAccount,
      params.familyId,
      params.teenAddress,
      amountWei,
      params.serviceName,
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    );

    const parsedEvents = await parseTransactionEvents(flowTx.txHash as `0x${string}`);

    await recordAction(
      pkpAccount,
      params.familyId,
      params.teenAddress,
      "subscription",
      true,
    );
    const passportAfter = await getPassport(params.familyId, params.teenAddress);
    const leveledUp = passportAfter.level > params.passportBefore.level;

    const receipt = buildSubscriptionReceipt({
      familyId: params.familyId,
      teen: params.teenAddress,
      guardian: params.guardianAddress,
      serviceName: params.serviceName,
      amount: params.monthlyAmount,
      decision: params.decision as any,
      guardianApproved: params.guardianApproved,
      guardianNote: params.guardianNote,
      flowTxHash: flowTx.txHash,
      passportBefore: params.passportBefore.level,
      passportAfter: passportAfter.level,
      totalActions: passportAfter.totalActions,
      preExplanation: params.preExplanation,
      postExplanation: params.postExplanation,
      approvalCid: params.approvalCid,
      zamaTxHash: params.zamaTxHash,
    });

    const storachaReceipt = await storeReceipt(receipt);

    let passportCid: { cid: string; url: string } | null = null;
    if (leveledUp) {
      passportCid = await storePassportSnapshot({
        familyId: params.familyId,
        teen: params.teenAddress,
        oldLevel: params.passportBefore.level,
        newLevel: passportAfter.level,
        triggeringAction: `Subscription: ${params.serviceName}`,
        flowTxHash: flowTx.txHash,
      });
    }

    const celebration = await celebrationMessage({
      teenName: params.teenName,
      action: "subscription",
      amount: Number(params.monthlyAmount),
      currency: "₹",
      leveledUp,
      oldLevel: params.passportBefore.level,
      newLevel: passportAfter.level,
      newLevelName: passportAfter.levelName,
      receiptCid: storachaReceipt.cid,
    });

    return {
      success: true,
      decision: params.decision as any,
      requiresApproval: false,
      flow: {
        txHash: flowTx.txHash,
        explorerUrl: flowTx.explorerUrl,
        events: parsedEvents.events,
        gasUsed: parsedEvents.gasUsed,
      },
      lit: { signed: true, actionCid: SAFE_EXECUTOR_CID, response: litResult.response },
      zama: {
        decision: params.decision as any,
        contractAddress: CONTRACTS.policy,
        evaluationTxHash: params.zamaTxHash || "",
      },
      storacha: {
        receiptCid: storachaReceipt.cid,
        receiptUrl: storachaReceipt.url,
        passportCid: passportCid?.cid,
        passportUrl: passportCid?.url,
      },
      passport: {
        oldLevel: params.passportBefore.level,
        newLevel: passportAfter.level,
        leveledUp,
      },
      clawrence: {
        preExplanation: params.preExplanation,
        postExplanation: params.postExplanation,
        celebration,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      decision: params.decision as any,
      requiresApproval: false,
      error: error?.message,
    };
  }
}

