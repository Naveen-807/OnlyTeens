import { NextRequest, NextResponse } from "next/server";

import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { addPendingRequest } from "@/lib/orchestration/approvalFlow";
import { requestSubscription } from "@/lib/orchestration/subscriptionFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = (body.idempotencyKey || req.headers.get("idempotency-key")) as string | null;

    if (!body?.session || !body?.familyId || !body?.teenAddress || !body?.monthlyAmount) {
      return fail(
        "BAD_REQUEST",
        "session, familyId, teenAddress, monthlyAmount are required",
        400,
      );
    }

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    const result = await requestSubscription({
      session: body.session,
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      guardianAddress: body.guardianAddress,
      teenName: body.teenName,
      serviceName: body.serviceName,
      monthlyAmount: body.monthlyAmount,
      clawrencePublicKey: body.clawrencePublicKey,
    });

    if (result.requiresApproval && result.approvalRequest) {
      addPendingRequest(result.approvalRequest);
    }

    if (idempotencyKey) setCachedIdempotentResult(idempotencyKey, result);
    return ok(result);
  } catch (error: any) {
    return fail(
      mapErrorToCode(error),
      error?.message || "Subscription request failed",
      500,
    );
  }
}
