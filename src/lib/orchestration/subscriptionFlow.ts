import "server-only";

import { parseTransactionEvents } from "@/lib/flow/events";
import { getPassport, recordAction } from "@/lib/flow/passport";
import { createSubscriptionSchedule } from "@/lib/flow/scheduler";
import { fundSubscription } from "@/lib/flow/vault";
import { preActionExplanation, postDecisionExplanation, guardianExplanation, celebrationMessage } from "@/lib/clawrence/engine";
import { executeSafeSigning } from "@/lib/lit/executor";
import { getClawrenceAccount } from "@/lib/lit/executorSession";
import { evaluateAction } from "@/lib/zama/policy";
import { getClawrenceExecutionContext } from "@/lib/vincent/execution";
import { evaluateVincentGuardrailsAsync } from "@/lib/vincent/policy";
import { uploadJSON } from "@/lib/storacha/client";
import {
  buildSubscriptionReceipt,
  storePassportSnapshot,
  storeReceipt,
} from "@/lib/storacha/receipts";
import { addReceipt, receiptFromFlowResult } from "@/lib/receipts/receiptStore";
import { createApprovalRequest } from "@/lib/approvals/durableApprovals";
import { flowToWei, inrToPaise } from "@/lib/money";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";
import { buildLaneMetadata } from "@/lib/runtime/lanes";
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
    assertContractConfigForDemo();
    const lane = buildLaneMetadata({
      session: params.session,
      executionLane: "agent-assisted-flow",
      approvalMode: "guardian-approval-required",
      policyMode: "encrypted-live",
    });
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

    const { account: clawrenceAccount } = await getClawrenceAccount(
      params.familyId,
      params.teenAddress,
    );
    const executionContext = await getClawrenceExecutionContext(
      params.familyId,
      params.teenAddress,
    );

    const policyResult = await evaluateAction({
      familyId: params.familyId,
      teenAddress: params.teenAddress,
      amount: inrToPaise(params.monthlyAmount),
      passportLevel: passportState.level,
      isRecurring: true,
      account: clawrenceAccount,
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
        ...lane,
        zama: {
          decision,
          contractAddress: CONTRACTS.policy,
          evaluationTxHash: policyResult.txHash || "",
          source: policyResult.source,
        },
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

    const approvalRequest: ApprovalRequest = createApprovalRequest({
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
    });

      return {
        success: false,
        decision,
        requiresApproval: true,
        ...lane,
        approvalRequestId: approvalRequest.id,
        approvalRequest,
        zama: {
          decision,
          contractAddress: CONTRACTS.policy,
          evaluationTxHash: policyResult.txHash || "",
          source: policyResult.source,
        },
      executionMode: executionContext.executionMode,
      fallbackActive: executionContext.fallbackActive,
      vincent: executionContext.vincent,
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
      executionMode: "local-fallback",
      fallbackActive: true,
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
    assertContractConfigForDemo();
    const lane = buildLaneMetadata({
      session: params.session,
      executionLane: "agent-assisted-flow",
      approvalMode: params.guardianApproved ? "guardian-approved" : "guardian-approval-required",
      policyMode: params.zamaTxHash ? "encrypted-live" : "degraded",
    });
    const { session: clawrenceSession, account: clawrenceAccount } =
      await getClawrenceAccount(params.familyId, params.teenAddress);
    const executionContext = await getClawrenceExecutionContext(
      params.familyId,
      params.teenAddress,
    );

    const subscriptionRecipient =
      (process.env.SUBSCRIPTION_RECIPIENT_ADDRESS as `0x${string}` | undefined) ||
      ("0x0000000000000000000000000000000000000000" as `0x${string}`);

    const guardrails = await evaluateVincentGuardrailsAsync({
      action: "subscription",
      amount: params.monthlyAmount,
      isRecurring: true,
      description: `${params.serviceName} subscription for ${params.monthlyAmount} FLOW per month`,
      recipientAddress: subscriptionRecipient,
      familyContext: {
        passportLevel: params.passportBefore.level,
      },
    });

    if (!guardrails.approved) {
      return {
        success: false,
        decision: params.decision as any,
        requiresApproval: false,
        ...lane,
        guardrail: {
          decision: "BLOCK",
          reason: guardrails.reasons[0],
          source: guardrails.provider,
        },
        guardrails,
        error: guardrails.reasons.join(" "),
      };
    }

    const litResult = await executeSafeSigning({
      action: "subscription",
      policyDecision: params.decision as any,
      guardianApproved: params.guardianApproved,
      amount: params.monthlyAmount,
      familyId: params.familyId,
      teenAddress: params.teenAddress,
      txData: new Uint8Array([]),
      session: params.session,
      clawrencePublicKey:
        clawrenceSession.pkpPublicKey || params.clawrencePublicKey,
      vincentGuardrailsPassed: guardrails.approved,
    });

    if (!litResult.signed) {
      return {
        success: false,
        decision: params.decision as any,
        requiresApproval: false,
        ...lane,
        zama: {
          decision: params.decision as any,
          contractAddress: CONTRACTS.policy,
          evaluationTxHash: params.zamaTxHash || "",
          source: params.zamaTxHash ? "encrypted" : "heuristic",
        },
        lit: {
          signed: false,
          actionCid: SAFE_EXECUTOR_CID,
          response: litResult.response,
        },
        executionMode: litResult.executionMode,
        fallbackActive: litResult.fallbackActive,
        chipotle: {
          configured: litResult.chipotle.configured,
          accountId: litResult.chipotle.accountId,
          groupId: litResult.chipotle.groupId,
          pkpId: litResult.chipotle.pkpId,
          walletId: litResult.chipotle.walletId,
          safeExecutorCid: litResult.chipotle.safeExecutorCid,
          usageKeyId: litResult.chipotle.usageKeyId,
          usageKeyScope: litResult.chipotle.usageKeyScope,
          mode: litResult.chipotle.mode,
        },
        vincent: executionContext.vincent,
        clawrence: { preExplanation: params.preExplanation, postExplanation: params.postExplanation },
        guardrail: {
          decision: "ALLOW",
          source: guardrails.provider,
        },
        guardrails,
        error: litResult.reason,
      };
    }

    if (
      isDemoStrictMode() &&
      subscriptionRecipient === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error(
        "MISSING_CONFIG:SUBSCRIPTION_RECIPIENT_ADDRESS is required in strict demo mode",
      );
    }
    const flowTx = await fundSubscription(
      clawrenceAccount,
      params.familyId,
      params.teenAddress,
      params.serviceName,
      params.monthlyAmount,
    );

    const amountWei = flowToWei(params.monthlyAmount);
    const scheduleResult = await createSubscriptionSchedule(
      clawrenceAccount,
      params.familyId,
      params.teenAddress,
      amountWei,
      params.serviceName,
      subscriptionRecipient,
    );

    const parsedEvents = await parseTransactionEvents(flowTx.txHash as `0x${string}`);

    await recordAction(
      clawrenceAccount,
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
      schedulerBackend: scheduleResult.backend,
      scheduleTxHash: scheduleResult.txHash,
      scheduleId: scheduleResult.scheduleId,
      scheduledExecutionId: scheduleResult.scheduledExecutionId,
      scheduledExecutionExplorerUrl: scheduleResult.scheduledExecutionExplorerUrl,
      nextExecutionAt: scheduleResult.nextExecutionAt,
      guardrails,
      litSignatureResponse: litResult.response,
    });

    const storachaReceipt = await storeReceipt(receipt);

    // ── Store receipt locally for dashboard UI ──
    const localReceipt = receiptFromFlowResult(
      {
        decision: params.decision,
        flow: { txHash: flowTx.txHash, explorerUrl: flowTx.explorerUrl },
        ...lane,
        lit: { actionCid: SAFE_EXECUTOR_CID },
        executionMode: litResult.executionMode,
        fallbackActive: litResult.fallbackActive,
        chipotle: {
          configured: litResult.chipotle.configured,
          accountId: litResult.chipotle.accountId,
          groupId: litResult.chipotle.groupId,
          pkpId: litResult.chipotle.pkpId,
          walletId: litResult.chipotle.walletId,
          safeExecutorCid: litResult.chipotle.safeExecutorCid,
          usageKeyId: litResult.chipotle.usageKeyId,
          usageKeyScope: litResult.chipotle.usageKeyScope,
          mode: litResult.chipotle.mode,
        },
        vincent: executionContext.vincent,
        guardrails,
        zama: { contractAddress: CONTRACTS.policy },
        storacha: { receiptCid: storachaReceipt.cid, receiptUrl: storachaReceipt.url },
        passport: { newLevel: passportAfter.level, leveledUp },
        schedule: {
          txHash: scheduleResult.txHash,
          scheduleId: scheduleResult.scheduleId,
          label: params.serviceName,
          recipientAddress: subscriptionRecipient,
          backend: scheduleResult.backend,
          executionSource: scheduleResult.executionSource,
          scheduledExecutionId: scheduleResult.scheduledExecutionId,
          scheduledExecutionExplorerUrl: scheduleResult.scheduledExecutionExplorerUrl,
          nextExecutionAt: scheduleResult.nextExecutionAt,
        },
        clawrence: { preExplanation: params.preExplanation },
      },
      {
        familyId: params.familyId,
        teenAddress: params.teenAddress,
        type: "subscription",
        description: `${params.serviceName} subscription`,
        amount: params.monthlyAmount,
      }
    );
    addReceipt(localReceipt);

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
        ...lane,
        flow: {
        txHash: flowTx.txHash,
        explorerUrl: flowTx.explorerUrl,
        events: parsedEvents.events,
        gasUsed: parsedEvents.gasUsed,
      },
      guardrail: {
        decision: "ALLOW",
        source: guardrails.provider,
      },
      guardrails,
      executionMode: litResult.executionMode,
      fallbackActive: litResult.fallbackActive,
      lit: { signed: true, actionCid: SAFE_EXECUTOR_CID, response: litResult.response },
      chipotle: {
        configured: litResult.chipotle.configured,
        accountId: litResult.chipotle.accountId,
        groupId: litResult.chipotle.groupId,
        pkpId: litResult.chipotle.pkpId,
        walletId: litResult.chipotle.walletId,
        safeExecutorCid: litResult.chipotle.safeExecutorCid,
        usageKeyId: litResult.chipotle.usageKeyId,
        usageKeyScope: litResult.chipotle.usageKeyScope,
        mode: litResult.chipotle.mode,
      },
      vincent: executionContext.vincent,
        zama: {
          decision: params.decision as any,
          contractAddress: CONTRACTS.policy,
          evaluationTxHash: params.zamaTxHash || "",
          source: params.zamaTxHash ? "encrypted" : "heuristic",
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
      schedule: {
        txHash: scheduleResult.txHash,
        scheduleId: scheduleResult.scheduleId,
        label: params.serviceName,
        recipientAddress: subscriptionRecipient,
        backend: scheduleResult.backend,
        executionSource: scheduleResult.executionSource,
        scheduledExecutionId: scheduleResult.scheduledExecutionId,
        scheduledExecutionExplorerUrl: scheduleResult.scheduledExecutionExplorerUrl,
        nextExecutionAt: scheduleResult.nextExecutionAt,
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
      executionMode: "local-fallback",
      fallbackActive: true,
      error: error?.message,
    };
  }
}
