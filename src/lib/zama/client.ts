import "server-only";

import { createInstance } from "fhevmjs";

import { isZeroAddress } from "@/lib/runtime/config";
import { assertLiveMode } from "@/lib/runtime/liveMode";

let instance: any = null;

const DEFAULT_RELAYER_URL = "https://relayer.testnet.zama.org";
const LEGACY_GATEWAY_URL = "https://gateway.sepolia.zama.ai";

function normalizeUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : null;
}

function isGatewayInitializationFailure(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message} ${error.cause ? String(error.cause) : ""}`
      : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("wrong gateway url") ||
    normalized.includes("gateway") ||
    normalized.includes("fetch failed") ||
    normalized.includes("enotfound") ||
    normalized.includes("econnreset") ||
    normalized.includes("etimedout") ||
    normalized.includes("429") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  );
}

function getGatewayCandidates(): string[] {
  const candidates = new Set<string>();

  const configuredRelayer = normalizeUrl(process.env.ZAMA_RELAYER_URL);
  const configuredGateway = normalizeUrl(process.env.ZAMA_GATEWAY_URL);

  if (configuredRelayer) {
    candidates.add(configuredRelayer);
  }

  if (configuredGateway && configuredGateway !== LEGACY_GATEWAY_URL) {
    candidates.add(configuredGateway);
  }

  candidates.add(DEFAULT_RELAYER_URL);
  candidates.add(LEGACY_GATEWAY_URL);

  return Array.from(candidates);
}

async function createFhevmInstanceWithFallbacks(params: {
  kmsContractAddress: string;
  aclContractAddress: string;
}) {
  let lastError: unknown = null;

  for (const gatewayUrl of getGatewayCandidates()) {
    try {
      return await createInstance({
        networkUrl: process.env.ZAMA_NETWORK_URL || "https://devnet.zama.ai",
        gatewayUrl,
        kmsContractAddress: params.kmsContractAddress,
        aclContractAddress: params.aclContractAddress,
      });
    } catch (error) {
      lastError = error;
      if (!isGatewayInitializationFailure(error)) {
        throw error;
      }
      console.warn(`[Zama] Gateway unavailable at ${gatewayUrl} - trying fallback`, error);
    }
  }

  throw new Error("POLICY_UNAVAILABLE:Unable to initialize Zama FHEVM instance", {
    cause: lastError ?? undefined,
  });
}

export async function getFhevmInstance() {
  if (!instance) {
    const kmsContractAddress =
      process.env.ZAMA_KMS_CONTRACT_ADDRESS ||
      "0x0000000000000000000000000000000000000000";
    const aclContractAddress =
      process.env.ZAMA_ACL_CONTRACT_ADDRESS ||
      "0x0000000000000000000000000000000000000000";

    assertLiveMode(
      !isZeroAddress(kmsContractAddress),
      "POLICY_UNAVAILABLE:ZAMA_KMS_CONTRACT_ADDRESS must be configured in live mode",
    );
    assertLiveMode(
      !isZeroAddress(aclContractAddress),
      "POLICY_UNAVAILABLE:ZAMA_ACL_CONTRACT_ADDRESS must be configured in live mode",
    );

    instance = await createFhevmInstanceWithFallbacks({
      kmsContractAddress,
      aclContractAddress,
    });
  }
  return instance;
}
