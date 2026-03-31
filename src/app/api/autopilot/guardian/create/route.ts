import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { parseEther } from "viem";
import { addGuardianAutopilotRecord } from "@/lib/autopilot/store";
import { attachErc8004Evidence } from "@/lib/erc8004/enrich";
import { createSavingsSchedule, createSubscriptionSchedule } from "@/lib/flow/scheduler";
import { getPassport } from "@/lib/flow/passport";
import { getFlowAccount } from "@/lib/lit/viemAccount";
import { getFamilyById, saveFamily } from "@/lib/onboarding/familyService";
import { addReceipt, createStoredReceipt } from "@/lib/receipts/receiptStore";
import { buildLaneMetadata, derivePolicyMode } from "@/lib/runtime/lanes";
import { evaluateAction } from "@/lib/zama/policy";
import type { FlowResult } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.session || !body?.familyId || !body?.teenAddress || !body?.amount || !body?.actionType) {
      return fail(
        "BAD_REQUEST",
        "session, familyId, teenAddress, amount, and actionType are required",
        400,
      );
    }
    if (body.session.role !== "guardian") {
      return fail("PERMISSION_DENIED", "Only guardians can enable autopilot", 403);
    }

    const family = getFamilyById(body.familyId);
    if (!family) {
      return fail("NOT_FOUND", `Family ${body.familyId} not found`, 404);
    }

    const account = await getFlowAccount(body.session);
    const passport = await getPassport(body.familyId, body.teenAddress);
    const zama = await evaluateAction({
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      amount: Number(body.amount),
      passportLevel: passport.level,
      isRecurring: true,
      requireEncrypted: process.env.PROOF18_LIVE_MODE === "true",
    });

    if (zama.decision === "BLOCKED" || zama.decision === "RED") {
      return fail(
        "POLICY_UNAVAILABLE",
        "Confidential policy did not allow guardian autopilot for this action",
        403,
      );
    }

    let schedule;
    if (body.actionType === "subscription") {
      schedule = await createSubscriptionSchedule(
        account,
        body.familyId,
        body.teenAddress,
        parseEther(String(body.amount)),
        body.serviceName || body.label || "subscription",
        body.recipientAddress,
      );
    } else {
      schedule = await createSavingsSchedule(
        account,
        body.familyId,
        body.teenAddress,
        parseEther(String(body.amount)),
        body.label || "guardian-autopilot",
        body.interval || "weekly",
      );
    }

    const lane = buildLaneMetadata({
      session: body.session,
      executionLane: "guardian-autopilot-flow",
      approvalMode: "guardian-autopilot",
      policyMode: derivePolicyMode(zama.source),
      guardianAutopilotEnabled: true,
    });

    const record = addGuardianAutopilotRecord({
      familyId: body.familyId,
      guardianAddress: body.session.address,
      teenAddress: body.teenAddress,
      actionType: body.actionType,
      amount: body.amount,
      interval: body.interval || "weekly",
      label: body.label || body.serviceName || "guardian-autopilot",
      serviceName: body.serviceName,
      scheduleId: schedule.scheduleId,
      scheduleTxHash: schedule.txHash,
      flowTxHash: schedule.txHash,
      flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${schedule.txHash}`,
      schedulerBackend: schedule.backend,
      policyMode: lane.policyMode,
      zamaTxHash: zama.txHash,
      enabled: true,
    });

    saveFamily({
      ...family,
      guardianAutopilotEnabled: true,
      policyMode: lane.policyMode,
    });

    addReceipt(
      createStoredReceipt({
        type: body.actionType,
        familyId: body.familyId,
        teenAddress: body.teenAddress,
        description: `Guardian autopilot enabled for ${body.label || body.serviceName || body.actionType}`,
        amount: body.amount,
        currency: "FLOW",
        decision: zama.decision,
        ...lane,
        flowTxHash: schedule.txHash,
        flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${schedule.txHash}`,
        storachaCid: "",
        storachaUrl: "",
        recipientAddress: body.recipientAddress,
        payeeLabel: body.serviceName,
        passportLevel: passport.level,
        passportLeveledUp: false,
        litActionCid: "",
        zamaContractAddress: process.env.NEXT_PUBLIC_POLICY_CONTRACT || process.env.POLICY_CONTRACT || "",
        clawrenceExplanation: "Guardian enabled bounded recurring autopilot.",
        schedulerBackend: schedule.backend,
        scheduledExecutionId: schedule.scheduledExecutionId,
        scheduledExecutionExplorerUrl: schedule.scheduledExecutionExplorerUrl,
        nextExecutionAt: schedule.nextExecutionAt,
        scheduleId: schedule.scheduleId,
        scheduleTxHash: schedule.txHash,
        zamaTxHash: zama.txHash,
        vincentAppId: family.vincentAppId,
        vincentAppVersion: family.vincentAppVersion,
        vincentJwtAuthenticated: family.vincentJwtAuthenticated,
        vincentUserAccount: family.vincentUserAccount,
        vincentAgentWalletAddress: family.vincentWalletAddress,
      }),
    );

    const result: FlowResult = {
      success: true,
      decision: zama.decision,
      requiresApproval: false,
      ...lane,
      flow: {
        txHash: schedule.txHash,
        explorerUrl: `https://evm-testnet.flowscan.io/tx/${schedule.txHash}`,
        events: [],
        gasUsed: "0",
      },
      zama: {
        decision: zama.decision,
        contractAddress: process.env.NEXT_PUBLIC_POLICY_CONTRACT || process.env.POLICY_CONTRACT || "",
        evaluationTxHash: zama.txHash,
        source: zama.source,
        guardianView:
          lane.policyMode === "encrypted-live"
            ? "Guardian saw encrypted-live policy approval."
            : "Guardian fell back to degraded policy mode.",
        teenView:
          lane.policyMode === "encrypted-live"
            ? "Autopilot fits the family policy."
            : "Autopilot used degraded policy checks.",
      },
      schedule: {
        txHash: schedule.txHash,
        scheduleId: schedule.scheduleId,
        label: schedule.label,
        interval: schedule.interval,
        recipientAddress: body.recipientAddress,
        backend: schedule.backend,
        executionSource: schedule.executionSource,
        scheduledExecutionId: schedule.scheduledExecutionId,
        scheduledExecutionExplorerUrl: schedule.scheduledExecutionExplorerUrl,
        nextExecutionAt: schedule.nextExecutionAt,
      },
    };

    const enriched = await attachErc8004Evidence({
      familyId: body.familyId,
      result,
      tag2: "guardian-autopilot-enable",
      requestURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/proof/judges?familyId=${body.familyId}`,
      feedbackURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/agent_log.json`,
    });

    return ok({ autopilot: record, result: enriched });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to create guardian autopilot", 500);
  }
}
