import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { answerQuestion } from "@/lib/clawrence/engine";
import { getFamilyById } from "@/lib/onboarding/familyService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.familyId || !body.prompt) {
      return fail("BAD_REQUEST", "familyId and prompt are required", 400);
    }

    const family = getFamilyById(body.familyId);
    if (!family) {
      return fail("NOT_FOUND", `Family ${body.familyId} not found`, 404);
    }

    const explanation = await answerQuestion({
      teenName: body.teenName || "Teen",
      question: body.prompt,
      passportLevel: Number(body.passportLevel || 0),
      savingsBalance: String(body.savingsBalance || "0"),
      subscriptionReserve: String(body.subscriptionReserve || "0"),
    });

    return ok({
      calma: {
        familyId: family.familyId,
        proposal: {
          summary: explanation,
          executionLane: "agent-assisted-flow",
          flowMedium: "FLOW",
          approvalMode: body.role === "guardian" ? "none" : "guardian-approval-required",
        },
        executionMode: family.executionMode,
        guardianAutopilotEnabled: family.guardianAutopilotEnabled || false,
        policyMode: family.policyMode || "degraded",
        vincent: {
          appId: family.vincentAppId,
          appVersion: family.vincentAppVersion,
          jwtAuthenticated: family.vincentJwtAuthenticated || false,
          userAccount: family.vincentUserAccount,
          agentWalletAddress: family.vincentWalletAddress,
        },
      },
    });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Proposal generation failed", 500);
  }
}
