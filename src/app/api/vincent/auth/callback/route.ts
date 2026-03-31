import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { getFamilyById, saveFamily } from "@/lib/onboarding/familyService";
import { verifyVincentJwt } from "@/lib/vincent/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.jwt) {
      return fail("BAD_REQUEST", "jwt is required", 400);
    }

    const verification = await verifyVincentJwt(body.jwt);

    if (body.familyId) {
      const family = getFamilyById(body.familyId);
      if (!family) {
        return fail("NOT_FOUND", `Family ${body.familyId} not found`, 404);
      }

      saveFamily({
        ...family,
        vincentAppId: verification.appId,
        vincentAppVersion: verification.appVersion,
        vincentUserAccount: verification.userAccount,
        vincentJwtAuthenticated: verification.jwtAuthenticated,
        vincentWalletId: verification.walletId || family.vincentWalletId,
        vincentWalletAddress: verification.walletAddress || family.vincentWalletAddress,
      });
    }

    return ok({ vincent: verification });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Vincent auth failed", 500);
  }
}
