import "server-only";

import { getFlowWalletAccount } from "@/lib/flow/walletSession";
import type { UserSession } from "@/lib/types";

export async function getFlowAccount(session: UserSession) {
  const phoneNumber =
    session.phoneNumber ||
    session.authMethod?.phoneNumber ||
    session.authMethod?.metadata?.phoneNumber;

  if (!phoneNumber) {
    throw new Error("Missing phone number for Flow wallet lookup");
  }

  return getFlowWalletAccount(session.role, phoneNumber);
}
