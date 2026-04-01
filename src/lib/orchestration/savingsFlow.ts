import "server-only";

import { createSavingsSchedule } from "@/lib/flow/scheduler";
import { parseTransactionEvents } from "@/lib/flow/events";
import { getFamilyById } from "@/lib/onboarding/familyService";
import { getPassport, recordAction } from "@/lib/flow/passport";
import { depositSavings } from "@/lib/flow/vault";
import { recordDefiAction } from "@/lib/defi/portfolio";
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
import { flowToPolicyUnits, flowToWei } from "@/lib/money";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { buildLaneMetadata } from "@/lib/runtime/lanes";
import type { FlowResult, UserSession } from "@/lib/types";
import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants";

function resolveTeenAddress(
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
): `0x${string}` {
  const family = getFamilyById(familyId);
  if (!family) {
    return teenAddress;
  }

  const normalizedTeenAddress = teenAddress.toLowerCase();
  const selectedTeen =
    family.teenAddress.toLowerCase() === normalizedTeenAddress
      ? null
      : family.linkedTeens?.find(
          (teen) => teen.active && teen.teenAddress.toLowerCase() === normalizedTeenAddress,
        ) || null;

  return (selectedTeen?.teenAddress || family.teenAddress) as `0x${string}`;
}

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
  defi?: {
    actionKind: "earn" | "goal" | "rebalance";
    strategy: "conservative" | "balanced" | "growth";
    goalName?: string;
    goalTarget?: string;
    protocolLabel?: string;
    riskLevel: "low" | "medium" | "high";
  };
}): Promise<FlowResult> {
  try {
    assertContractConfigForDemo();
    const lane = buildLaneMetadata({
      session: params.session,
      executionLane: "agent-assisted-flow",
      approvalMode: "none",
      policyMode: "encrypted-live",
    });
    const teenAddress = resolveTeenAddress(params.familyId, params.teenAddress);
    const passportBefore = await getPassport(params.familyId, teenAddress);
    const isDefiPlan = Boolean(params.defi);
    const actionLabel = isDefiPlan ? params.defi?.actionKind || "earn" : "save";
    const requestDescription = isDefiPlan
      ? params.defi?.goalName
        ? `${params.defi.actionKind} ${params.amount} FLOW toward ${params.defi.goalName}`
        : `${params.defi?.actionKind || "earn"} ${params.amount} FLOW with a ${params.defi?.strategy || "balanced"} plan`
      : `Save ${params.amount} FLOW ${params.isRecurring ? params.interval : "once"}`;

    const preExplanation = await preActionExplanation({
      teenName: params.teenName,
      action: actionLabel,
      description: requestDescription,
      amount: Number(params.amount),
      currency: "FLOW",
      isRecurring: params.isRecurring,
      passportLevel: passportBefore.level,
      passportStreak: passportBefore.weeklyStreak,
    });

    const { session: clawrenceSession, account: clawrenceAccount } = await getClawrenceAccount(
      params.familyId,
      teenAddress,
    );
    const executionContext = await getClawrenceExecutionContext(
      params.familyId,
      teenAddress,
    );

    const policyResult = await evaluateAction({
      familyId: params.familyId,
      teenAddress,
      amount: flowToPolicyUnits(params.amount),
      passportLevel: passportBefore.level,
      isRecurring: params.isRecurring,
      account: clawrenceAccount,
      requireEncrypted: true,
    });

    const decision = policyResult.decision;

    const postExplanation = await postDecisionExplanation({
      teenName: params.teenName,
      action: isDefiPlan ? params.defi?.actionKind || "earn" : "savings",
      description: requestDescription,
      amount: Number(params.amount),
      currency: "FLOW",
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
            reason: guardrails.reasons?.[0] || "Guardian review required",
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
      teenAddress,
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
      teenAddress,
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
        teenAddress,
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
      teenAddress,
      "savings",
      true,
    );

    const passportAfter = await getPassport(params.familyId, teenAddress);
    const leveledUp = passportAfter.level > passportBefore.level;

    const receipt = buildSavingsReceipt({
      familyId: params.familyId,
      teen: teenAddress,
      guardian: params.guardianAddress,
      amount: params.amount,
      decision,
      receiptType: isDefiPlan ? "defi" : "savings",
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
      defi: params.defi
        ? {
            actionKind: params.defi.actionKind,
            strategy: params.defi.strategy,
            goalName: params.defi.goalName,
            protocolLabel: params.defi.protocolLabel,
            riskLevel: params.defi.riskLevel,
            estimatedApr: undefined,
            targetAmount: params.defi.goalTarget,
          }
        : undefined,
    });

    const storachaReceipt = await storeReceipt(receipt);

    let defiPortfolio: Awaited<ReturnType<typeof recordDefiAction>> | undefined;
    if (params.defi) {
      defiPortfolio = await recordDefiAction({
        familyId: params.familyId,
        teenAddress,
        actionKind: params.defi.actionKind,
        amount: params.amount,
        strategy: params.defi.strategy,
        goalName: params.defi.goalName,
        goalTarget: params.defi.goalTarget,
        flowTxHash: flowTx.txHash,
        receiptCid: storachaReceipt.cid,
      });
    }

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
        defi: params.defi
          ? {
              actionKind: params.defi.actionKind,
              strategy: params.defi.strategy,
              goalName: params.defi.goalName,
              protocolLabel: params.defi.protocolLabel,
              riskLevel: params.defi.riskLevel,
              portfolio: defiPortfolio,
            }
          : undefined,
        clawrence: { preExplanation },
      },
      {
        familyId: params.familyId,
        teenAddress,
        type: isDefiPlan ? "defi" : "savings",
        description: requestDescription,
        amount: params.amount,
      },
    );
    addReceipt(localReceipt);

    let passportCid: { cid: string; url: string } | null = null;
    if (leveledUp) {
      passportCid = await storePassportSnapshot({
        familyId: params.familyId,
        teen: teenAddress,
        oldLevel: passportBefore.level,
        newLevel: passportAfter.level,
        triggeringAction: "Savings deposit",
        flowTxHash: flowTx.txHash,
      });
    }

    const celebration = await celebrationMessage({
      teenName: params.teenName,
      action: isDefiPlan ? params.defi?.actionKind || "earn" : "savings",
      amount: Number(params.amount),
      currency: "FLOW",
      leveledUp,
      oldLevel: passportBefore.level,
      newLevel: passportAfter.level,
      newLevelName: passportAfter.levelName,
      receiptCid: storachaReceipt.cid,
    });

    const defiResult =
      params.defi && defiPortfolio
        ? {
            actionKind: params.defi.actionKind,
            strategy: params.defi.strategy,
            goalName: params.defi.goalName,
            protocolLabel: params.defi.protocolLabel,
            riskLevel: params.defi.riskLevel,
            portfolio: defiPortfolio,
          }
        : undefined;

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
      defi: defiResult,
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
