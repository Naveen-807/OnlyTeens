import { getLitClient } from "./litClient";

const SAFE_EXECUTOR_IPFS_CID = process.env.SAFE_EXECUTOR_CID!;

export async function executeWithClawrence(params: {
  action: "savings" | "subscription";
  policyDecision: "GREEN" | "YELLOW" | "RED" | "BLOCKED";
  guardianApproved: boolean;
  txData: Uint8Array;
  clawrencePublicKey: string;
  sessionSigs: any;
}) {
  const client = await getLitClient();

  const result = await client.executeJs({
    ipfsId: SAFE_EXECUTOR_IPFS_CID,
    sessionSigs: params.sessionSigs,
    jsParams: {
      action: params.action,
      policyDecision: params.policyDecision,
      guardianApproved: params.guardianApproved,
      txData: params.txData,
      publicKey: params.clawrencePublicKey,
      sigName: "proof18Sig",
    },
  });

  return {
    signatures: result.signatures,
    response: JSON.parse(result.response as string),
    logs: result.logs,
  };
}
