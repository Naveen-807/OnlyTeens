import { NextResponse } from "next/server";

import { CONTRACTS, SAFE_EXECUTOR_CID, FLOW_TESTNET, SEPOLIA } from "@/lib/constants";
import { buildCalmaAgentLog, buildCalmaAgentManifest, getErc8004Config } from "@/lib/erc8004/client";
import { listReceipts } from "@/lib/receipts/receiptStore";

/**
 * GET /api/evidence
 *
 * Returns a consolidated view of all sponsor integration proof.
 * Judges can use this to verify that all 4 sponsors are live and working.
 */
export async function GET() {
  try {
    const receipts = listReceipts();
    const recentReceipts = receipts.slice(-10);
    const erc8004 = getErc8004Config();

    // Collect unique CIDs and tx hashes from receipts
    const flowTxHashes: string[] = [];
    const storachaCids: string[] = [];
    const zamaTxHashes: string[] = [];

    for (const r of recentReceipts) {
      if (r.flowTxHash) flowTxHashes.push(r.flowTxHash);
      if (r.storachaCid) storachaCids.push(r.storachaCid);
      if (r.zamaTxHash) zamaTxHashes.push(r.zamaTxHash);
    }

    const evidence = {
      timestamp: new Date().toISOString(),
      sponsors: {
        calma: {
          name: "Calma",
          role: "Family finance agent layer",
          manifest: buildCalmaAgentManifest(),
          logPreview: buildCalmaAgentLog(),
        },
        flow: {
          name: "Flow Blockchain",
          role: "Execution Rail — Gasless consumer DeFi",
          network: FLOW_TESTNET.name,
          chainId: FLOW_TESTNET.id,
          contracts: {
            access: {
              address: CONTRACTS.access,
              explorer: `https://evm-testnet.flowscan.io/address/${CONTRACTS.access}`,
            },
            vault: {
              address: CONTRACTS.vault,
              explorer: `https://evm-testnet.flowscan.io/address/${CONTRACTS.vault}`,
            },
            scheduler: {
              address: CONTRACTS.scheduler,
              explorer: `https://evm-testnet.flowscan.io/address/${CONTRACTS.scheduler}`,
            },
            passport: {
              address: CONTRACTS.passport,
              explorer: `https://evm-testnet.flowscan.io/address/${CONTRACTS.passport}`,
            },
          },
          recentTransactions: flowTxHashes.map((hash) => ({
            txHash: hash,
            explorer: `https://evm-testnet.flowscan.io/tx/${hash}`,
          })),
          features: [
            "Gasless transactions via Gelato Relay",
            "Scheduled savings vault (automated recurring deposits)",
            "Scheduled subscription payments",
            "Passport progression system",
            "Walletless onboarding (no seed phrase, no gas)",
          ],
        },
        zama: {
          name: "Zama fhEVM",
          role: "Confidential Policy Engine — FHE-encrypted family rules",
          network: SEPOLIA.name,
          chainId: SEPOLIA.id,
          contracts: {
            policy: {
              address: CONTRACTS.policy,
              explorer: `https://sepolia.etherscan.io/address/${CONTRACTS.policy}`,
            },
          },
          recentEvaluations: zamaTxHashes.map((hash) => ({
            txHash: hash,
            explorer: `https://sepolia.etherscan.io/tx/${hash}`,
          })),
          features: [
            "Encrypted policy inputs (spending caps, trust thresholds, risk flags)",
            "FHE computation on ciphertexts (GREEN/YELLOW/RED/BLOCKED output)",
            "ACL-based selective decryption (guardian sees more than teen)",
            "Zero-knowledge proofs for encrypted input validation",
            "Real deployment on Ethereum Sepolia with Zama co-processor",
          ],
        },
        lit: {
          name: "Lit Protocol",
          role: "Programmable Key Management — Role-scoped identity & signing",
          safeExecutorCid: SAFE_EXECUTOR_CID,
          safeExecutorUrl: SAFE_EXECUTOR_CID
            ? `https://ipfs.io/ipfs/${SAFE_EXECUTOR_CID}`
            : null,
          features: [
            "PKP Native Auth (phone OTP, no seed phrases)",
            "Role-separated permissions (Guardian > Teen > Calma AI)",
            "IPFS-pinned Lit Action as immutable safe executor",
            "PKP Viem Account for real transaction signing",
            "Encrypt/decrypt for role-gated policy explanations",
          ],
        },
        storacha: {
          name: "Storacha",
          role: "Verifiable Evidence Layer — Tamper-proof, content-addressed receipts",
          recentReceipts: storachaCids.map((cid) => ({
            cid,
            url: `https://storacha.link/ipfs/${cid}`,
          })),
          features: [
            "Content-addressed receipt storage (every action gets a CID)",
            "UCAN-scoped permissions matching family roles",
            "Passport snapshot storage (immutable trust progression)",
            "Guardian approval records (verifiable proof of consent)",
            "Calma conversation logs (AI accountability)",
          ],
        },
        erc8004: {
          name: "ERC-8004",
          role: "Agent identity, reputation, and validation",
          chainId: erc8004.chainId,
          registries: {
            identity: erc8004.identityRegistry,
            reputation: erc8004.reputationRegistry,
            validation: erc8004.validationRegistry,
          },
          agentManifestUrl: `${erc8004.agentUriBase}/agent.json`,
          agentLogUrl: `${erc8004.agentUriBase}/agent_log.json`,
        },
      },
      crossTrackSynergy: {
        description:
          "All 4 sponsors are used in every financial action. None can be removed without breaking the product.",
        flow: "Teen requests action → Lit authenticates → Zama evaluates → Lit signs → Flow executes → Storacha stores receipt → Passport updates",
      },
      totalReceipts: receipts.length,
      totalFlowTransactions: flowTxHashes.length,
      totalStorachaCids: storachaCids.length,
    };

    return NextResponse.json(evidence);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to gather evidence" },
      { status: 500 },
    );
  }
}
