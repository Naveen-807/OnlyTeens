import "server-only";

import { SAFE_EXECUTOR_CID } from "@/lib/constants";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { getLitClient } from "@/lib/lit/client";
import { buildPhoneAuthContext } from "@/lib/lit/auth";
import type { ActionType, PolicyDecision, UserSession } from "@/lib/types";

export interface ExecutorParams {
  action: ActionType;
  policyDecision: PolicyDecision;
  guardianApproved: boolean;
  amount: string;
  familyId: string;
  txData: Uint8Array;
  clawrencePublicKey: string;
  session: UserSession;
}

export interface ExecutorResult {
  signed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  response: any;
  signatures?: any;
}

export async function executeSafeSigning(
  params: ExecutorParams,
): Promise<ExecutorResult> {
  assertContractConfigForDemo();
  if (!SAFE_EXECUTOR_CID) {
    throw new Error("MISSING_CONFIG:SAFE_EXECUTOR_CID is required for execution");
  }
  const client = await getLitClient();
  const { authContext } = await buildPhoneAuthContext(params.session);

  const result: any = await (client as any).executeJs({
    ipfsId: SAFE_EXECUTOR_CID,
    authContext,
    jsParams: {
      action: params.action,
      policyDecision: params.policyDecision,
      guardianApproved: params.guardianApproved,
      amount: params.amount,
      familyId: params.familyId,
      txData: params.txData,
      publicKey: params.clawrencePublicKey,
      sigName: "proof18Sig",
    },
  });

  const response = JSON.parse(result.response as string);

  return {
    signed: response.signed,
    reason: response.reason,
    requiresApproval: response.requiresApproval,
    response,
    signatures: result.signatures,
  };
}
