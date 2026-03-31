import { NextRequest, NextResponse } from "next/server";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { withCalmaAliases } from "@/lib/calma/compat";
import { attachErc8004Evidence } from "@/lib/erc8004/enrich";
import {
  approveRequestDurable,
  markExecuted,
} from "@/lib/approvals/durableApprovals";
import { executeApprovedSubscription } from "@/lib/orchestration/subscriptionFlow";
import { getPassport } from "@/lib/flow/passport";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, guardianNote, session } = body;
    const idempotencyKey = (body.idempotencyKey || req.headers.get("idempotency-key")) as string | null;

    if (!requestId || !session) {
      return fail("BAD_REQUEST", "requestId and session are required", 400);
    }

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    // Step 1: Approve and store on Storacha
    const approval = await approveRequestDurable(requestId, guardianNote);
    const request = approval.request;

    // Step 2: Execute the approved action
    const passportBefore = await getPassport(
      request.familyId as `0x${string}`,
      request.teenAddress as `0x${string}`
    );

    const serviceName =
      request.description.split(" subscription")[0] || request.description;

    const result = await executeApprovedSubscription({
      session,
      familyId: request.familyId as `0x${string}`,
      teenAddress: request.teenAddress as `0x${string}`,
      guardianAddress: session.address,
      teenName: request.teenName,
      serviceName,
      monthlyAmount: String(request.amount),
      clawrencePublicKey: session.pkpPublicKey,
      decision: request.policyDecision,
      passportBefore,
      preExplanation: request.clawrencePreExplanation,
      postExplanation: "",
      guardianApproved: true,
      guardianNote,
      approvalCid: approval.approvalCid,
    });

    // Step 3: Mark executed in durable store
    if (result.success && result.flow) {
      markExecuted(
        requestId,
        result.flow.txHash,
        result.storacha?.receiptCid || ""
      );
    }

    const enrichedExecution = await attachErc8004Evidence({
      familyId: request.familyId,
      result,
      tag2: "guardian-approved-agent-flow",
      requestURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/proof/judges?familyId=${request.familyId}`,
      feedbackURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/agent_log.json`,
    });

    const response = withCalmaAliases({
      approval: { cid: approval.approvalCid, url: approval.approvalUrl },
      execution: enrichedExecution,
    });
    if (idempotencyKey) setCachedIdempotentResult(idempotencyKey, response);
    return ok(response);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error.message, 500);
  }
}
