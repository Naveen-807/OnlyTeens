import "server-only";

import { createSavingsSchedule } from "@/lib/flow/scheduler";
import { parseTransactionEvents } from "@/lib/flow/events";
import { getPassport, recordAction } from "@/lib/flow/passport";
import { depositSavings } from "@/lib/flow/vault";
import { preActionExplanation, postDecisionExplanation, celebrationMessage } from "@/lib/clawrence/engine";
import { executeSafeSigning } from "@/lib/lit/executor";
import { getPkpAccount } from "@/lib/lit/viemAccount";
import { evaluateAction } from "@/lib/zama/policy";
import {
  buildSavingsReceipt,
  storePassportSnapshot,
  storeReceipt,
} from "@/lib/storacha/receipts";
import { addReceipt, receiptFromFlowResult } from "@/lib/receipts/receiptStore";
import { flowToWei, inrToPaise } from "@/lib/money";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import type { FlowResult, UserSession } from "@/lib/types";
import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants.server";

export async function executeSavingsFlow(params: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: string;
  teenName: string;
  amount: string; // FLOW
  isRecurring: boolean;
  interval: "weekly" | "monthly";
  clawrencePublicKey: string;
  clawrencePkpTokenId: string;
}): Promise<FlowResult> {
  try {
    assertContractConfigForDemo();
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

    const policyResult = await evaluateAction({
      familyId: params.familyId,
      amount: inrToPaise(params.amount),
      passportLevel: passportBefore.level,
      isRecurring: false,
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

    const litResult = await executeSafeSigning({
      action: "savings",
      policyDecision: decision,
      guardianApproved: false,
      amount: params.amount,
      familyId: params.familyId,
      txData: new Uint8Array([]),
      clawrencePublicKey: params.clawrencePublicKey,
      sessionSigs: params.session.sessionSigs,
    });

    if (!litResult.signed) {
      return {
        success: false,
        decision,
        requiresApproval: litResult.requiresApproval || false,
        lit: { signed: false, actionCid: SAFE_EXECUTOR_CID, response: litResult.response },
        clawrence: { preExplanation, postExplanation },
        error: litResult.reason,
      };
    }

    const pkpAccount = await getPkpAccount(
      params.session.pkpPublicKey,
      params.session.sessionSigs,
    );

    const flowTx = await depositSavings(
      pkpAccount,
      params.familyId,
      params.teenAddress,
      params.amount,
    );

    if (params.isRecurring) {
      const amountWei = flowToWei(params.amount);
      await createSavingsSchedule(
        pkpAccount,
        params.familyId,
        params.teenAddress,
        amountWei,
        `auto-save-${params.interval}`,
        params.interval,
      );
    }

    const parsedEvents = await parseTransactionEvents(flowTx.txHash as `0x${string}`);

    await recordAction(
      pkpAccount,
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
      flowTxHash: flowTx.txHash,
      passportBefore: passportBefore.level,
      passportAfter: passportAfter.level,
      totalActions: passportAfter.totalActions,
      preExplanation,
      postExplanation,
      zamaTxHash: policyResult.txHash || undefined,
    });

    const storachaReceipt = await storeReceipt(receipt);

    // ── Store receipt locally for dashboard UI ──
    const localReceipt = receiptFromFlowResult(
      {
        decision,
        flow: { txHash: flowTx.txHash, explorerUrl: flowTx.explorerUrl },
        lit: { actionCid: SAFE_EXECUTOR_CID },
        zama: {
          contractAddress: CONTRACTS.policy,
          evaluationTxHash: policyResult.txHash || "",
        },
        storacha: { receiptCid: storachaReceipt.cid, receiptUrl: storachaReceipt.url },
        passport: { newLevel: passportAfter.level, leveledUp },
        clawrence: { preExplanation },
      },
      {
        familyId: params.familyId,
        teenAddress: params.teenAddress,
        type: "savings",
        description: `Save ${params.amount} FLOW ${params.isRecurring ? params.interval : "once"}`,
        amount: params.amount,
      }
    );
    await addReceipt(localReceipt);

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
      flow: {
        txHash: flowTx.txHash,
        explorerUrl: flowTx.explorerUrl,
        events: parsedEvents.events,
        gasUsed: parsedEvents.gasUsed,
      },
      lit: {
        signed: true,
        actionCid: SAFE_EXECUTOR_CID,
        response: litResult.response,
      },
      zama: {
        decision,
        contractAddress: CONTRACTS.policy,
        evaluationTxHash: policyResult.txHash || "",
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
