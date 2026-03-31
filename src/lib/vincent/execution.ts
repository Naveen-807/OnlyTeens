import "server-only";

import { getServiceAccount } from "@/lib/flow/clients";
import { getFamilyById } from "@/lib/onboarding/familyService";
import { isChipotleConfigured } from "@/lib/lit/chipotle";
import type { ExecutionMode } from "@/lib/types";
import { getAgentWallet, isVincentConfigured } from "@/lib/vincent/client";

export async function getClawrenceExecutionContext(
  familyId: string,
  teenAddress?: `0x${string}`,
): Promise<{
  family: NonNullable<ReturnType<typeof getFamilyById>>;
  account: ReturnType<typeof getServiceAccount>;
  executionMode: ExecutionMode;
  fallbackActive: boolean;
  vincent: {
    configured: boolean;
    live: boolean;
    walletAddress?: string;
    walletId?: string;
    note: string;
  };
}> {
  const family = getFamilyById(familyId);
  if (!family || !family.active) {
    throw new Error(`FAMILY_NOT_FOUND:${familyId}`);
  }

  const selectedTeen =
    teenAddress && family.teenAddress.toLowerCase() !== teenAddress.toLowerCase()
      ? family.linkedTeens?.find(
          (teen) => teen.active && teen.teenAddress.toLowerCase() === teenAddress.toLowerCase(),
        )
      : null;

  let walletAddress = selectedTeen?.vincentWalletAddress || family.vincentWalletAddress;
  const configured = isVincentConfigured();
  if (configured && !walletAddress) {
    const wallet = await getAgentWallet();
    if (wallet.success && wallet.data?.address) {
      walletAddress = wallet.data.address;
    }
  }

  const live = Boolean(configured && walletAddress);
  const executionMode: ExecutionMode = live
    ? "vincent-live"
    : isChipotleConfigured() || family.chipotleAccountId
      ? "chipotle-fallback"
      : "local-fallback";

  return {
    family,
    account: getServiceAccount(),
    executionMode,
    fallbackActive: executionMode !== "vincent-live",
    vincent: {
      configured,
      live,
      walletAddress,
      walletId: selectedTeen?.vincentWalletId || family.vincentWalletId,
      note: live
        ? "Vincent wallet is configured and selected as Calma's primary execution surface."
        : "Vincent wallet is unavailable; execution falls back to the Chipotle/local sponsored path.",
    },
  };
}
