import { NextRequest, NextResponse } from "next/server";
import {
  getPendingRequestsByFamily,
  getAllRequestsByFamily,
} from "@/lib/approvals/durableApprovals";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { withCalmaAliases } from "@/lib/calma/compat";

export async function GET(req: NextRequest) {
  try {
    const familyId = req.nextUrl.searchParams.get("familyId");
    const includeAll = req.nextUrl.searchParams.get("all") === "true";

    if (!familyId) {
      return fail("BAD_REQUEST", "familyId required", 400);
    }

    const requests = includeAll
      ? getAllRequestsByFamily(familyId)
      : getPendingRequestsByFamily(familyId);

    const payload = requests.map((request) => withCalmaAliases(request));

    return ok({
      items: payload,
      requests: payload,
      approvals: payload,
      count: payload.length,
    });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error.message, 500);
  }
}
