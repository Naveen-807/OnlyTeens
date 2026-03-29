import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { revokeExecutorPermission } from "@/lib/lit/permissions";
import { getFamilyById } from "@/lib/onboarding/familyService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const familyId = body.familyId as string | undefined;
    const cid = body.cid as string | undefined;

    if (!familyId || !cid) {
      return fail("BAD_REQUEST", "familyId and cid are required", 400);
    }

    const family = getFamilyById(familyId);
    if (!family?.clawrencePkpTokenId) {
      return fail("NOT_FOUND", "Clawrence PKP not found for family", 404);
    }

    await revokeExecutorPermission(family.clawrencePkpTokenId, cid);
    return ok({ revoked: true, familyId, cid });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to revoke executor permission", 500);
  }
}
