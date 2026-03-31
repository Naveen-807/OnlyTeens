import { NextRequest } from "next/server";

import { buildCalmaAgentLog, buildCalmaAgentManifest, getErc8004Config } from "@/lib/erc8004/client";
import { listGuardianAutopilotRecords } from "@/lib/autopilot/store";
import { listReceipts } from "@/lib/receipts/receiptStore";
import { getRuntimeCapabilities } from "@/lib/runtime/capabilities";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const familyId = req.nextUrl.searchParams.get("familyId") || undefined;
    const capabilities = await getRuntimeCapabilities(familyId);
    const receipts = listReceipts().filter((receipt) => !familyId || receipt.familyId === familyId);
    const erc8004 = getErc8004Config();
    const autopilot = listGuardianAutopilotRecords(familyId);

    const directFlow = receipts.filter((receipt) => receipt.executionLane === "direct-flow");
    const agentAssisted = receipts.filter((receipt) => receipt.executionLane === "agent-assisted-flow");
    const guardianAutopilot = receipts.filter(
      (receipt) => receipt.executionLane === "guardian-autopilot-flow",
    );

    return ok({
      generatedAt: new Date().toISOString(),
      brand: "Calma",
      flowMedium: "FLOW",
      judgesMode: {
        lanes: {
          directFlow,
          agentAssistedFlow: agentAssisted,
          guardianAutopilotFlow: guardianAutopilot,
        },
        directFlowEvidence: directFlow.map((receipt) => ({
          id: receipt.id,
          action: receipt.description,
          flowTxHash: receipt.flowTxHash,
          flowExplorerUrl: receipt.flowExplorerUrl,
          balanceSnapshot: {
            flowMediumBalance: receipt.flowMediumBalance,
            nativeWalletBalance: receipt.nativeWalletBalance,
          },
        })),
        agentAssistedEvidence: agentAssisted.map((receipt) => ({
          id: receipt.id,
          action: receipt.description,
          flowTxHash: receipt.flowTxHash,
          flowExplorerUrl: receipt.flowExplorerUrl,
          zamaTxHash: receipt.zamaTxHash,
          vincent: {
            appId: receipt.vincentAppId,
            appVersion: receipt.vincentAppVersion,
            jwtAuthenticated: receipt.vincentJwtAuthenticated,
            userAccount: receipt.vincentUserAccount,
            agentWalletAddress: receipt.vincentAgentWalletAddress,
          },
          erc8004: {
            agentId: receipt.erc8004AgentId,
            identityTxHash: receipt.erc8004IdentityTxHash,
            reputationTxHashes: receipt.erc8004ReputationTxHashes,
            validationTxHashes: receipt.erc8004ValidationTxHashes,
          },
        })),
        guardianAutopilotEvidence: {
          records: autopilot,
          receipts: guardianAutopilot,
        },
        zama: {
          policyMode: guardianAutopilot.some((item) => item.policyMode === "encrypted-live") ||
            agentAssisted.some((item) => item.policyMode === "encrypted-live")
            ? "encrypted-live"
            : "blocked",
          evaluations: receipts
            .filter((receipt) => receipt.zamaTxHash)
            .map((receipt) => ({
              id: receipt.id,
              policyMode: receipt.policyMode,
              zamaTxHash: receipt.zamaTxHash,
              teenView: "Policy passed confidential review.",
              guardianView: "Guardian can inspect the live encrypted evaluation.",
            })),
        },
        vincent: {
          mode: capabilities.vincent.mode,
          appId: capabilities.vincent.appId,
          appVersion: capabilities.vincent.appVersion,
          familyProof: capabilities.lit.familyProof,
        },
        lit: {
          safeExecutorCid: capabilities.lit.safeExecutorCid,
          configured: capabilities.lit.configured,
          permissions: capabilities.lit.familyProof.permissions,
        },
        erc8004: {
          config: {
            chainId: erc8004.chainId,
            identityRegistry: erc8004.identityRegistry,
            reputationRegistry: erc8004.reputationRegistry,
            validationRegistry: erc8004.validationRegistry,
          },
          manifestUrl: `${erc8004.agentUriBase}/agent.json`,
          logUrl: `${erc8004.agentUriBase}/agent_log.json`,
          manifest: buildCalmaAgentManifest(),
          log: buildCalmaAgentLog(),
        },
      },
      runtime: capabilities,
    });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to build judges proof", 500);
  }
}
