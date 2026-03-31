import "server-only";

import { createHash } from "node:crypto";

import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { normalizePrivateKeyEnv } from "@/lib/runtime/privateKey";
import { assertLiveMode } from "@/lib/runtime/liveMode";
import { loadFamilies } from "@/lib/onboarding/familyService";
import { listReceipts } from "@/lib/receipts/receiptStore";

const SEPOLIA_CHAIN = {
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"] },
  },
} as const;

const IDENTITY_ABI = parseAbi([
  "function register(string agentURI) external returns (uint256 agentId)",
  "function setAgentURI(uint256 agentId, string newURI) external",
  "function tokenURI(uint256 agentId) external view returns (string)",
  "function getAgentWallet(uint256 agentId) external view returns (address)",
]);

const REPUTATION_ABI = parseAbi([
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external",
  "function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)",
]);

const VALIDATION_ABI = parseAbi([
  "function validationRequest(address validatorAddress, uint256 agentId, string requestURI, bytes32 requestHash) external",
  "function validationResponse(bytes32 requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag) external",
  "function getValidationStatus(bytes32 requestHash) external view returns (address validatorAddress, uint256 agentId, uint8 response, bytes32 responseHash, string tag, uint256 lastUpdate)",
]);

export function getErc8004Config() {
  return {
    chainId: Number(process.env.ERC8004_CHAIN_ID || 11155111),
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY_ADDRESS as `0x${string}` | undefined,
    reputationRegistry: process.env.ERC8004_REPUTATION_REGISTRY_ADDRESS as `0x${string}` | undefined,
    validationRegistry: process.env.ERC8004_VALIDATION_REGISTRY_ADDRESS as `0x${string}` | undefined,
    operatorKey: process.env.CALMA_OPERATOR_PRIVATE_KEY,
    agentUriBase: process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api",
  };
}

function getOperatorAccount() {
  const key = process.env.CALMA_OPERATOR_PRIVATE_KEY;
  if (!key) return null;
  return privateKeyToAccount(normalizePrivateKeyEnv("CALMA_OPERATOR_PRIVATE_KEY", key));
}

function getWalletClient() {
  return createWalletClient({
    chain: SEPOLIA_CHAIN,
    transport: http(getErc8004Config().rpcUrl),
  });
}

function getPublicClient() {
  return createPublicClient({
    chain: SEPOLIA_CHAIN,
    transport: http(getErc8004Config().rpcUrl),
  });
}

function latestFamily() {
  return Object.values(loadFamilies())
    .filter((family) => family.active)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}

export function buildCalmaAgentManifest() {
  const config = getErc8004Config();
  const family = latestFamily();

  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "Calma",
    description:
      "Calma is the Proof18 family finance agent. It analyzes requests with Vincent, enforces confidential policy with Zama, and executes approved actions on Flow.",
    image: `${config.agentUriBase}/og/calma.png`,
    services: [
      {
        name: "web",
        endpoint: `${config.agentUriBase.replace(/\/api$/, "")}`,
      },
      {
        name: "MCP",
        endpoint: "https://heyvincent.ai/mcp",
        version: "2026-03-31",
      },
      {
        name: "Vincent",
        endpoint: "https://dashboard.heyvincent.ai/developer/dashboard",
        version: process.env.VINCENT_APP_VERSION || "v1",
      },
    ],
    x402Support: false,
    active: true,
    registrations: config.identityRegistry
      ? [
          {
            agentId: family?.erc8004AgentId ? Number(family.erc8004AgentId) : 0,
            agentRegistry: `eip155:${config.chainId}:${config.identityRegistry}`,
          },
        ]
      : [],
    supportedTrust: ["reputation", "crypto-economic", "tee-attestation"],
    wallets: {
      calma: family?.calmaAddress || family?.clawrenceAddress || null,
      vincentAgentWallet: family?.vincentWalletAddress || null,
    },
  };
}

export function buildCalmaAgentLog() {
  return {
    generatedAt: new Date().toISOString(),
    receipts: listReceipts().slice(0, 25).map((receipt) => ({
      id: receipt.id,
      familyId: receipt.familyId,
      description: receipt.description,
      flowTxHash: receipt.flowTxHash,
      zamaTxHash: receipt.zamaTxHash,
      storachaCid: receipt.storachaCid,
      schedulerBackend: receipt.schedulerBackend,
      timestamp: receipt.timestamp,
    })),
  };
}

export async function registerCalmaAgent(agentURI: string) {
  const config = getErc8004Config();
  const account = getOperatorAccount();
  assertLiveMode(Boolean(account), "ERC8004_UNAVAILABLE:Missing CALMA_OPERATOR_PRIVATE_KEY");
  if (!account || !config.identityRegistry) {
    throw new Error("ERC8004_UNAVAILABLE:Identity registry config is missing");
  }

  const txHash = await getWalletClient().writeContract({
    account,
    address: config.identityRegistry,
    abi: IDENTITY_ABI,
    functionName: "register",
    args: [agentURI],
  });

  return { txHash };
}

export async function updateCalmaAgentURI(agentId: bigint, agentURI: string) {
  const config = getErc8004Config();
  const account = getOperatorAccount();
  assertLiveMode(Boolean(account), "ERC8004_UNAVAILABLE:Missing CALMA_OPERATOR_PRIVATE_KEY");
  if (!account || !config.identityRegistry) {
    throw new Error("ERC8004_UNAVAILABLE:Identity registry config is missing");
  }

  const txHash = await getWalletClient().writeContract({
    account,
    address: config.identityRegistry,
    abi: IDENTITY_ABI,
    functionName: "setAgentURI",
    args: [agentId, agentURI],
  });

  return { txHash };
}

export async function giveCalmaFeedback(params: {
  agentId: bigint;
  value: number;
  tag1?: string;
  tag2?: string;
  endpoint?: string;
  feedbackURI?: string;
}) {
  const config = getErc8004Config();
  const account = getOperatorAccount();
  assertLiveMode(Boolean(account), "ERC8004_UNAVAILABLE:Missing CALMA_OPERATOR_PRIVATE_KEY");
  if (!account || !config.reputationRegistry) {
    throw new Error("ERC8004_UNAVAILABLE:Reputation registry config is missing");
  }

  const feedbackHash = params.feedbackURI
    ? (`0x${createHash("sha256").update(params.feedbackURI).digest("hex")}` as `0x${string}`)
    : ("0x".padEnd(66, "0") as `0x${string}`);

  const txHash = await getWalletClient().writeContract({
    account,
    address: config.reputationRegistry,
    abi: REPUTATION_ABI,
    functionName: "giveFeedback",
    args: [
      params.agentId,
      BigInt(params.value),
      0,
      params.tag1 || "proof18",
      params.tag2 || "verified-action",
      params.endpoint || `${config.agentUriBase.replace(/\/api$/, "")}/api/agent.json`,
      params.feedbackURI || "",
      feedbackHash,
    ],
  });

  return { txHash };
}

export async function requestCalmaValidation(params: {
  validatorAddress: `0x${string}`;
  agentId: bigint;
  requestURI: string;
}) {
  const config = getErc8004Config();
  const account = getOperatorAccount();
  assertLiveMode(Boolean(account), "ERC8004_UNAVAILABLE:Missing CALMA_OPERATOR_PRIVATE_KEY");
  if (!account || !config.validationRegistry) {
    throw new Error("ERC8004_UNAVAILABLE:Validation registry config is missing");
  }

  const requestHash = `0x${createHash("sha256").update(params.requestURI).digest("hex")}` as `0x${string}`;
  const txHash = await getWalletClient().writeContract({
    account,
    address: config.validationRegistry,
    abi: VALIDATION_ABI,
    functionName: "validationRequest",
    args: [params.validatorAddress, params.agentId, params.requestURI, requestHash],
  });

  return { txHash, requestHash };
}

export async function getCalmaValidationStatus(requestHash: `0x${string}`) {
  const config = getErc8004Config();
  if (!config.validationRegistry) {
    throw new Error("ERC8004_UNAVAILABLE:Validation registry config is missing");
  }

  return getPublicClient().readContract({
    address: config.validationRegistry,
    abi: VALIDATION_ABI,
    functionName: "getValidationStatus",
    args: [requestHash],
  });
}

export async function recordCalmaExecutionEvidence(params: {
  familyId: string;
  feedbackURI: string;
  requestURI: string;
  tag2: string;
}) {
  const family = getFamilyByIdOrLatest(params.familyId);
  if (!family?.erc8004AgentId) {
    return {
      agentId: undefined,
      identityTxHash: family?.erc8004IdentityTxHash,
      reputationTxHashes: [] as string[],
      validationTxHashes: [] as string[],
    };
  }

  const result = {
    agentId: family.erc8004AgentId,
    identityTxHash: family.erc8004IdentityTxHash,
    reputationTxHashes: [] as string[],
    validationTxHashes: [] as string[],
  };

  try {
    const feedback = await giveCalmaFeedback({
      agentId: BigInt(family.erc8004AgentId),
      value: 100,
      tag1: "proof18",
      tag2: params.tag2,
      feedbackURI: params.feedbackURI,
    });
    result.reputationTxHashes.push(feedback.txHash);
  } catch {
    // Best-effort: direct lane must not fail when ERC-8004 is unavailable.
  }

  const validatorAddress = process.env.ERC8004_VALIDATOR_ADDRESS as `0x${string}` | undefined;
  if (validatorAddress) {
    try {
      const validation = await requestCalmaValidation({
        validatorAddress,
        agentId: BigInt(family.erc8004AgentId),
        requestURI: params.requestURI,
      });
      result.validationTxHashes.push(validation.txHash);
    } catch {
      // Best-effort only.
    }
  }

  return result;
}

function getFamilyByIdOrLatest(familyId: string) {
  const families = loadFamilies();
  return (
    families[familyId] ||
    Object.values(families)
      .filter((family) => family.active)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
  );
}
