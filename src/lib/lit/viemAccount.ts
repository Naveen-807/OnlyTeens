import "server-only";

import { getFlowWalletAccount } from "@/lib/flow/walletSession";
import { getServiceAccount } from "@/lib/flow/clients";
import type { UserSession } from "@/lib/types";

/**
 * Get an account for PKP-based operations.
 * For hackathon: Uses the service account for actual contract writes.
 * PKP signing/policy enforcement happens through executeSafeSigning in executor.ts.
 *
 * In production, this would use the Lit Protocol's getPkpViemAccount with proper
 * authContext from session signatures.
 */
export async function getPkpAccount(session: UserSession) {
  // For hackathon demo: Use service account for contract writes
  // The Lit Protocol PKP signing is handled separately through executeSafeSigning
  // which uses the session's authContext for policy enforcement
  return getServiceAccount();
}

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
