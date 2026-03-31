import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { cancelGuardianAutopilotRecord, listGuardianAutopilotRecords } from "@/lib/autopilot/store";
import { attachErc8004Evidence } from "@/lib/erc8004/enrich";
import { pauseSchedule } from "@/lib/flow/scheduler";
import { getFlowAccount } from "@/lib/lit/viemAccount";
import { getFamilyById, saveFamily } from "@/lib/onboarding/familyService";
import { addReceipt, createStoredReceipt } from "@/lib/receipts/receiptStore";
import { buildLaneMetadata } from "@/lib/runtime/lanes";
import type { FlowResult } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.session || !body?.familyId || !body?.autopilotId) {
      return fail("BAD_REQUEST", "session, familyId, and autopilotId are required", 400);
    }
    if (body.session.role !== "guardian") {
      return fail("PERMISSION_DENIED", "Only guardians can cancel autopilot", 403);
    }

    const family = getFamilyById(body.familyId);
    if (!family) {
      return fail("NOT_FOUND", `Family ${body.familyId} not found`, 404);
    }

    const record = listGuardianAutopilotRecords(body.familyId).find(
      (item) => item.id === body.autopilotId,
    );
    if (!record) {
      return fail("NOT_FOUND", `Autopilot ${body.autopilotId} not found`, 404);
    }
    if (typeof record.scheduleId !== "number") {
      return fail("BAD_REQUEST", "Autopilot record has no scheduleId", 400);
    }

    const account = await getFlowAccount(body.session);
    const txHash = await pauseSchedule(account, record.scheduleId);
    const cancelled = cancelGuardianAutopilotRecord(record.id);

    saveFamily({
      ...family,
      guardianAutopilotEnabled: false,
    });

    const lane = buildLaneMetadata({
      session: body.session,
      executionLane: "guardian-autopilot-flow",
      approvalMode: "guardian-autopilot",
      policyMode: record.policyMode,
      guardianAutopilotEnabled: false,
    });

    addReceipt(
      createStoredReceipt({
        type: record.actionType,
        familyId: record.familyId,
        teenAddress: record.teenAddress,
        description: `Guardian autopilot cancelled for ${record.label}`,
        amount: record.amount,
        currency: "FLOW",
        decision: "GREEN",
        ...lane,
        flowTxHash: txHash,
        flowExplorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
        storachaCid: "",
        storachaUrl: "",
        recipientAddress: undefined,
        payeeLabel: record.serviceName,
        passportLevel: 0,
        passportLeveledUp: false,
        litActionCid: "",
        zamaContractAddress: process.env.NEXT_PUBLIC_POLICY_CONTRACT || process.env.POLICY_CONTRACT || "",
        clawrenceExplanation: "Guardian disabled bounded recurring autopilot.",
        schedulerBackend: record.schedulerBackend,
        scheduleId: record.scheduleId,
        scheduleTxHash: txHash,
        zamaTxHash: record.zamaTxHash,
        vincentAppId: family.vincentAppId,
        vincentAppVersion: family.vincentAppVersion,
        vincentJwtAuthenticated: family.vincentJwtAuthenticated,
        vincentUserAccount: family.vincentUserAccount,
        vincentAgentWalletAddress: family.vincentWalletAddress,
      }),
    );

    const result: FlowResult = {
      success: true,
      decision: "GREEN",
      requiresApproval: false,
      ...lane,
      flow: {
        txHash,
        explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
        events: [],
        gasUsed: "0",
      },
      schedule: {
        txHash,
        scheduleId: record.scheduleId,
        label: record.label,
        backend: record.schedulerBackend,
      },
    };

    const enriched = await attachErc8004Evidence({
      familyId: body.familyId,
      result,
      tag2: "guardian-autopilot-cancel",
      requestURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/proof/judges?familyId=${body.familyId}`,
      feedbackURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/agent_log.json`,
    });

    return ok({ autopilot: cancelled, result: enriched });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to cancel guardian autopilot", 500);
  }
}
