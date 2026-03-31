import "server-only";

import { recordCalmaExecutionEvidence } from "@/lib/erc8004/client";
import { updateReceiptByFlowTxHash } from "@/lib/receipts/receiptStore";
import type { FlowResult } from "@/lib/types";

export async function attachErc8004Evidence(params: {
  familyId: string;
  result: FlowResult;
  tag2: string;
  requestURI: string;
  feedbackURI: string;
}) {
  if (!params.result.success || !params.result.flow?.txHash) {
    return params.result;
  }

  const erc8004 = await recordCalmaExecutionEvidence({
    familyId: params.familyId,
    requestURI: params.requestURI,
    feedbackURI: params.feedbackURI,
    tag2: params.tag2,
  });

  if (!erc8004.agentId) {
    return params.result;
  }

  updateReceiptByFlowTxHash(params.result.flow.txHash, (receipt) => ({
    ...receipt,
    erc8004AgentId: erc8004.agentId,
    erc8004IdentityTxHash: erc8004.identityTxHash,
    erc8004ReputationTxHashes: erc8004.reputationTxHashes,
    erc8004ValidationTxHashes: erc8004.validationTxHashes,
  }));

  return {
    ...params.result,
    erc8004: {
      chainId: Number(process.env.ERC8004_CHAIN_ID || 11155111),
      agentId: erc8004.agentId,
      identityTxHash: erc8004.identityTxHash,
      reputationTxHashes: erc8004.reputationTxHashes,
      validationTxHashes: erc8004.validationTxHashes,
      registry: {
        identity: process.env.ERC8004_IDENTITY_REGISTRY_ADDRESS || "",
        reputation: process.env.ERC8004_REPUTATION_REGISTRY_ADDRESS || "",
        validation: process.env.ERC8004_VALIDATION_REGISTRY_ADDRESS || "",
      },
    },
  } satisfies FlowResult;
}
