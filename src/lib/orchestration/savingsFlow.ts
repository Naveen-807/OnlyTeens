import "server-only";

import { createSavingsSchedule } from "@/lib/flow/scheduler";
import { parseTransactionEvents } from "@/lib/flow/events";
import { getPassport, recordAction } from "@/lib/flow/passport";
import { depositSavings } from "@/lib/flow/vault";
import { preActionExplanation, postDecisionExplanation, celebrationMessage } from "@/lib/clawrence/engine";
import { executeSafeSigning } from "@/lib/lit/executor";
import { getClawrenceAccount } from "@/lib/lit/executorSession";
import { evaluateAction } from "@/lib/zama/policy";
import { getClawrenceExecutionContext } from "@/lib/vincent/execution";
import { evaluateVincentGuardrailsAsync } from "@/lib/vincent/policy";
import {
  buildSavingsReceipt,
  storePassportSnapshot,
  storeReceipt,
} from "@/lib/storacha/receipts";
import { addReceipt, receiptFromFlowResult } from "@/lib/receipts/receiptStore";
import { flowToWei, inrToPaise } from "@/lib/money";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { buildLaneMetadata } from "@/lib/runtime/lanes";
import type { FlowResult, UserSession } from "@/lib/types";
import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants";

export async function executeSavingsFlow(params: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: string;
  teenName: string;
  amount: string;
  isRecurring: boolean;
  interval: "weekly" | "monthly";
  clawrencePublicKey: string;
  clawrencePkpTokenId: string;
}): Promise<FlowResult> {
  try {
    assertContractConfigForDemo();
    const lane = buildLaneMetadata({
      session: params.session,
      executionLane: "agent-assisted-flow",
      approvalMode: "none",
      policyMode: "encrypted-live",
    });
    const passportBefore = await getPassport(params.familyId, params.teenAddress);

    const preExplanation = await preActionExplanation({
      teenName: params.teenName,
      action: "save",
      description: `Save ${params.amount} FLOW ${params.isRecurring ? params.interval : "once"}`,
      amount: Number(params.amount),
      currency: "₹",
      isRecurring: params.isRecurring,
      passportLevel: passportBefore.level,
      passportStreak: passportBefore.weeklyStreak,
    });

    const { session: clawrenceSession, account: clawrenceAccount } = await getClawrenceAccount(
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
      amount: inrToPaise(params.amount),
      passportLevel: passportBefore.level,
      isRecurring: params.isRecurring,
      account: clawrenceAccount,
      requireEncrypted: true,
    });

    const decision = policyResult.decision;

    const postExplanation = await postDecisionExplanation({
      teenName: params.teenName,
      action: "savings",
      description: `Save ${params.amount} FLOW`,
      amount: Number(params.amount),
      currency: "₹",
      decision,
      passportLevel: passportBefore.level,
    });

    const guardrails = await evaluateVincentGuardrailsAsync({
      action: "savings",
      amount: params.amount,
      isRecurring: params.isRecurring,
      description: `Teen savings request for ${params.amount} FLOW${params.isRecurring ? ` on a ${params.interval} cadence` : ""}`,
      recipientAddress: CONTRACTS.vault,
      familyContext: {
        passportLevel: passportBefore.level,
      },
    });

    if (!guardrails.approved) {
      return {
        success: false,
        decision,
        requiresApproval: false,
        ...lane,
        guardrail: {
          decision: "BLOCK",
          reason: guardrails.reasons[0],
          source: guardrails.provider,
        },
        guardrails,
        executionMode: executionContext.executionMode,
        fallbackActive: executionContext.fallbackActive,
        vincent: executionContext.vincent,
        clawrence: { preExplanation, postExplanation },
        error: guardrails.reasons.join(" "),
      };
    }

    const litResult = await executeSafeSigning({
      action: "savings",
      policyDecision: decision,
      guardianApproved: false,
      amount: params.amount,
      familyId: params.familyId,
      teenAddress: params.teenAddress,
      txData: new Uint8Array([]),
      clawrencePublicKey: clawrenceSession.pkpPublicKey || params.clawrencePublicKey,
      session: params.session,
      vincentGuardrailsPassed: guardrails.approved,
    });

    if (!litResult.signed) {
      return {
        success: false,
        decision,
        requiresApproval: litResult.requiresApproval || false,
        ...lane,
        zama: {
          decision,
          contractAddress: CONTRACTS.policy,
          evaluationTxHash: policyResult.txHash || "",
          source: policyResult.source,
          guardianView: "Guardian can inspect the encrypted decision on Sepolia.",
          teenView: "Policy passed confidential review.",
        },
        guardrail: {
          decision: "ALLOW",
          source: guardrails.provider,
        },
        guardrails,
        executionMode: litResult.executionMode,
        fallbackActive: litResult.fallbackActive,
        lit: { signed: false, actionCid: SAFE_EXECUTOR_CID, response: litResult.response },
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
        clawrence: { preExplanation, postExplanation },
        error: litResult.reason,
      };
    }

    const flowTx = await depositSavings(
      clawrenceAccount,
      params.familyId,
      params.teenAddress,
      params.amount,
    );

    let scheduleResult:
      | {
          txHash: string;
          scheduleId: number;
          label: string;
          interval?: "weekly" | "monthly";
          backend?: "flow-native-scheduled" | "evm-manual";
          executionSource?: "flow-evm-contract" | "flow-native-scheduled";
          scheduledExecutionId?: string;
          scheduledExecutionExplorerUrl?: string;
          nextExecutionAt?: string;
        }
      | undefined;

    if (params.isRecurring) {
      const amountWei = flowToWei(params.amount);
      const createdSchedule = await createSavingsSchedule(
        clawrenceAccount,
        params.familyId,
        params.teenAddress,
        amountWei,
        `auto-save-${params.interval}`,
        params.interval,
      );
      scheduleResult = createdSchedule;
    }

    const parsedEvents = await parseTransactionEvents(flowTx.txHash as `0x${string}`);

    await recordAction(
      clawrenceAccount,
      params.familyId,
      params.teenAddress,
      "savings",
      true,
    );

    const passportAfter = await getPassport(params.familyId, params.teenAddress);
    const leveledUp = passportAfter.level > passportBefore.level;

    const receipt = buildSavingsReceipt({
      familyId: params.familyId,
      teen: params.teenAddress,
      guardian: params.guardianAddress,
      amount: params.amount,
      decision,
      isRecurring: params.isRecurring,
      interval: params.interval,
      flowTxHash: flowTx.txHash,
      passportBefore: passportBefore.level,
      passportAfter: passportAfter.level,
      totalActions: passportAfter.totalActions,
      preExplanation,
      postExplanation,
      litSignatureResponse: litResult.response,
      guardrails,
      schedulerBackend: scheduleResult?.backend,
      scheduleTxHash: scheduleResult?.txHash,
      scheduleId: scheduleResult?.scheduleId,
      scheduledExecutionId: scheduleResult?.scheduledExecutionId,
      scheduledExecutionExplorerUrl: scheduleResult?.scheduledExecutionExplorerUrl,
      nextExecutionAt: scheduleResult?.nextExecutionAt,
      zamaTxHash: policyResult.txHash || undefined,
    });

    const storachaReceipt = await storeReceipt(receipt);

    const localReceipt = receiptFromFlowResult(
      {
        decision,
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
        schedule: scheduleResult,
        clawrence: { preExplanation },
      },
      {
        familyId: params.familyId,
        teenAddress: params.teenAddress,
        type: "savings",
        description: `Save ${params.amount} FLOW ${params.isRecurring ? params.interval : "once"}`,
        amount: params.amount,
      },
    );
    addReceipt(localReceipt);

    let passportCid: { cid: string; url: string } | null = null;
    if (leveledUp) {
      passportCid = await storePassportSnapshot({
        familyId: params.familyId,
        teen: params.teenAddress,
        oldLevel: passportBefore.level,
        newLevel: passportAfter.level,
        triggeringAction: "Savings deposit",
        flowTxHash: flowTx.txHash,
      });
    }

    const celebration = await celebrationMessage({
      teenName: params.teenName,
      action: "savings",
      amount: Number(params.amount),
      currency: "₹",
      leveledUp,
      oldLevel: passportBefore.level,
      newLevel: passportAfter.level,
      newLevelName: passportAfter.levelName,
      receiptCid: storachaReceipt.cid,
    });

    return {
      success: true,
        decision,
        requiresApproval: false,
        ...lane,
        flow: {
        txHash: flowTx.txHash,
        explorerUrl: flowTx.explorerUrl,
        events: parsedEvents.events,
        gasUsed: parsedEvents.gasUsed,
      },
      executionMode: litResult.executionMode,
      fallbackActive: litResult.fallbackActive,
      lit: {
        signed: true,
        actionCid: SAFE_EXECUTOR_CID,
        response: litResult.response,
      },
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
      guardrail: {
        decision: "ALLOW",
        source: guardrails.provider,
      },
      guardrails,
      vincent: executionContext.vincent,
        zama: {
          decision,
          contractAddress: CONTRACTS.policy,
          evaluationTxHash: policyResult.txHash || "",
          source: policyResult.source,
          guardianView: "Guardian can inspect the encrypted decision on Sepolia.",
          teenView: "Policy passed confidential review.",
        },
      storacha: {
        receiptCid: storachaReceipt.cid,
        receiptUrl: storachaReceipt.url,
        passportCid: passportCid?.cid,
        passportUrl: passportCid?.url,
      },
      passport: {
        oldLevel: passportBefore.level,
        newLevel: passportAfter.level,
        leveledUp,
      },
      schedule: scheduleResult,
      clawrence: {
        preExplanation,
        postExplanation,
        celebration,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      decision: "BLOCKED",
      requiresApproval: false,
      error: error?.message || "Unknown error in savings flow",
    };
  }
}
