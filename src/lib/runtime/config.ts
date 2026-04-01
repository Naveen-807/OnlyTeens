import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants";
import { resolveDeploymentContract } from "@/lib/runtime/deploymentArtifacts";
import { isStrictRuntimeMode } from "@/lib/runtime/demoMode";
import { isLiveMode } from "@/lib/runtime/liveMode";
import { normalizePrivateKeyEnv } from "@/lib/runtime/privateKey";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const LIVE_REQUIRED_ENV = {
  flow: [
    "GAS_FREE_RPC_URL",
    "FLOW_TESTNET_PRIVATE_KEY",
    "NEXT_PUBLIC_ACCESS_CONTRACT",
    "NEXT_PUBLIC_VAULT_CONTRACT",
    "NEXT_PUBLIC_SCHEDULER_CONTRACT",
    "NEXT_PUBLIC_PASSPORT_CONTRACT",
  ],
  zama: [
    "SEPOLIA_RPC_URL",
    "ZAMA_NETWORK_URL",
    "ZAMA_GATEWAY_URL",
    "ZAMA_KMS_CONTRACT_ADDRESS",
    "ZAMA_ACL_CONTRACT_ADDRESS",
  ],
  chipotle: [
    "CHIPOTLE_BASE_URL",
    "CHIPOTLE_ACCOUNT_API_KEY",
    "CHIPOTLE_OWNER_ADDRESS",
    "LIT_MINTING_KEY",
    "SAFE_EXECUTOR_CID",
  ],
  vincent: [
    "VINCENT_API_KEY",
    "VINCENT_APP_ID",
    "VINCENT_APP_VERSION",
    "VINCENT_REDIRECT_URI",
    "VINCENT_JWT_AUDIENCE",
  ],
  erc8004: [
    "CALMA_OPERATOR_PRIVATE_KEY",
    "ERC8004_IDENTITY_REGISTRY_ADDRESS",
    "ERC8004_REPUTATION_REGISTRY_ADDRESS",
    "ERC8004_VALIDATION_REGISTRY_ADDRESS",
  ],
  storageAndAi: ["STORACHA_KEY", "STORACHA_PROOF"],
} as const;

const AI_KEY_PLACEHOLDERS = new Set(["sk-your-key", "sk-or-v1-your-openrouter-key"]);

function normalizeAiKey(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || AI_KEY_PLACEHOLDERS.has(trimmed)) return undefined;
  return trimmed;
}

export function getClawrenceApiKey(): string | undefined {
  return normalizeAiKey(process.env.OPENROUTER_API_KEY) || normalizeAiKey(process.env.OPENAI_API_KEY);
}

export function isOpenRouterConfigured(): boolean {
  const openRouterKey = normalizeAiKey(process.env.OPENROUTER_API_KEY);
  const legacyApiKey = normalizeAiKey(process.env.OPENAI_API_KEY);
  return Boolean(openRouterKey || legacyApiKey?.startsWith("sk-or-"));
}

export function assertClawrenceAiConfig(): void {
  if (!getClawrenceApiKey()) {
    throw new Error("MISSING_CONFIG:OPENROUTER_API_KEY or OPENAI_API_KEY is not configured");
  }
}

export function isZeroAddress(value?: string): boolean {
  return !value || value.toLowerCase() === ZERO_ADDRESS;
}

export function assertContractConfigForDemo(): void {
  if (!isStrictRuntimeMode()) return;

  const requiredContracts = [
    ["ACCESS_CONTRACT", CONTRACTS.access],
    ["VAULT_CONTRACT", CONTRACTS.vault],
    ["SCHEDULER_CONTRACT", CONTRACTS.scheduler],
    ["PASSPORT_CONTRACT", CONTRACTS.passport],
    ["POLICY_CONTRACT", CONTRACTS.policy],
  ] as const;

  for (const [name, address] of requiredContracts) {
    if (isZeroAddress(address)) {
      throw new Error(`MISSING_CONFIG:${name} is not configured`);
    }
  }

  if (!SAFE_EXECUTOR_CID) {
    throw new Error("MISSING_CONFIG:SAFE_EXECUTOR_CID is not configured");
  }

  if (isLiveMode()) {
    const canonicalContracts = {
      access: resolveDeploymentContract("access")?.address,
      vault: resolveDeploymentContract("vault")?.address,
      scheduler: resolveDeploymentContract("scheduler")?.address,
      passport: resolveDeploymentContract("passport")?.address,
      policy: resolveDeploymentContract("policy")?.address,
    } as const;

    for (const [name, address] of Object.entries(canonicalContracts)) {
      if (!address) {
        throw new Error(`DEPLOYMENT_MISMATCH:Missing canonical deployment record for ${name}`);
      }
      const runtimeAddress = CONTRACTS[name as keyof typeof canonicalContracts];
      if (runtimeAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(
          `DEPLOYMENT_MISMATCH:${name} runtime address ${runtimeAddress} does not match canonical deployment ${address}`,
        );
      }
    }
  }

  if (isLiveMode()) {
    assertEnvForDemo([
      ...LIVE_REQUIRED_ENV.vincent,
      ...LIVE_REQUIRED_ENV.erc8004,
      ...LIVE_REQUIRED_ENV.storageAndAi,
    ]);
    assertClawrenceAiConfig();

    if (isZeroAddress(process.env.ZAMA_KMS_CONTRACT_ADDRESS)) {
      throw new Error("MISSING_CONFIG:ZAMA_KMS_CONTRACT_ADDRESS is not configured");
    }

    if (isZeroAddress(process.env.ZAMA_ACL_CONTRACT_ADDRESS)) {
      throw new Error("MISSING_CONFIG:ZAMA_ACL_CONTRACT_ADDRESS is not configured");
    }
  }
}

export function assertPhoneAuthConfigForDemo(): void {
  if (!isStrictRuntimeMode()) return;
}

export function assertFamilyOnboardingConfigForDemo(): void {
  if (!isStrictRuntimeMode()) return;

  assertContractConfigForDemo();
  normalizePrivateKeyEnv(
    "FLOW_TESTNET_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY",
    process.env.FLOW_TESTNET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY,
  );
}

export function assertEnvForDemo(required: string[]): void {
  if (!isStrictRuntimeMode()) return;
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`MISSING_CONFIG:${key} is not configured`);
    }
  }
}
