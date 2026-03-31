import { NextRequest, NextResponse } from "next/server";

import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { withCalmaAliases } from "@/lib/calma/compat";
import { attachErc8004Evidence } from "@/lib/erc8004/enrich";
import { executeApprovedSubscription } from "@/lib/orchestration/subscriptionFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = (body.idempotencyKey || req.headers.get("idempotency-key")) as string | null;

    if (!body?.session || !body?.familyId || !body?.teenAddress || !body?.serviceName) {
      return fail("BAD_REQUEST", "session, familyId, teenAddress, serviceName are required", 400);
    }

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    const result = await executeApprovedSubscription(body);
    const enriched = await attachErc8004Evidence({
      familyId: body.familyId,
      result,
      tag2: "agent-assisted-flow",
      requestURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/proof/judges?familyId=${body.familyId}`,
      feedbackURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/agent_log.json`,
    });
    const payload = withCalmaAliases(enriched);
    if (idempotencyKey) setCachedIdempotentResult(idempotencyKey, payload);
    return ok(payload);
  } catch (error: any) {
    return fail(
      mapErrorToCode(error),
      error?.message || "Subscription execution failed",
      500,
    );
  }
}
