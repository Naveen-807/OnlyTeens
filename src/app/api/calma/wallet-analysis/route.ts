import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { getFamilyById } from "@/lib/onboarding/familyService";
import { getAgentWallet, isVincentConfigured } from "@/lib/vincent/client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const family = body.familyId ? getFamilyById(body.familyId) : null;
    const userControllerAddress =
      body.userControllerAddress || family?.guardianAddress || undefined;
    const vincentWallet = isVincentConfigured() && userControllerAddress
      ? await getAgentWallet({
          userControllerAddress,
          appId: family?.vincentAppId || process.env.VINCENT_APP_ID,
        })
      : null;

    return ok({
      calma: {
        familyId: family?.familyId,
        agentAddress: family?.calmaAddress || family?.clawrenceAddress,
        vincent: {
          configured: isVincentConfigured(),
          appId: family?.vincentAppId || process.env.VINCENT_APP_ID,
          appVersion: family?.vincentAppVersion || process.env.VINCENT_APP_VERSION,
          userAccount: family?.vincentUserAccount,
          jwtAuthenticated: family?.vincentJwtAuthenticated || false,
          walletAddress:
            vincentWallet?.success ? vincentWallet.data?.address : family?.vincentWalletAddress,
          balances: vincentWallet?.success ? vincentWallet.data?.balances : [],
        },
        execution: {
          mode: family?.executionMode,
          fallbackActive: family?.fallbackActive,
          walletMode: family?.walletMode,
          gasMode: family?.gasMode,
          executionLaneModes:
            family?.executionLaneModes || ["direct-flow", "agent-assisted-flow", "guardian-autopilot-flow"],
          flowMedium: family?.flowMedium || "FLOW",
          guardianAutopilotEnabled: family?.guardianAutopilotEnabled || false,
          policyMode: family?.policyMode || "encrypted-live",
        },
      },
    });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Wallet analysis failed", 500);
  }
}
