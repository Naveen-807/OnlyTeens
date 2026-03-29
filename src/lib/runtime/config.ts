import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants.server";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isZeroAddress(value?: string): boolean {
  return !value || value.toLowerCase() === ZERO_ADDRESS;
}

export function assertContractConfigForDemo(): void {
  if (!isDemoStrictMode()) return;

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
}

export function assertEnvForDemo(required: string[]): void {
  if (!isDemoStrictMode()) return;
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`MISSING_CONFIG:${key} is not configured`);
    }
  }
}
