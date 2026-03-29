import "server-only";

import fs from "node:fs";
import path from "node:path";

export * from "@/lib/constants";

type DeploymentsJson = {
  contracts?: {
    access?: { address?: string };
    vault?: { address?: string };
    scheduler?: { address?: string };
    passport?: { address?: string };
  };
};

function resolveContractAddress(...values: Array<string | undefined>): `0x${string}` {
  const value = values.find(Boolean) || "0x0000000000000000000000000000000000000000";
  return value as `0x${string}`;
}

export function readDeployments(): DeploymentsJson | null {
  try {
    const deploymentsPath = path.join(process.cwd(), "deployments.json");
    if (!fs.existsSync(deploymentsPath)) return null;
    return JSON.parse(fs.readFileSync(deploymentsPath, "utf8")) as DeploymentsJson;
  } catch {
    return null;
  }
}

const deployments = readDeployments();

export const CONTRACTS = {
  access: resolveContractAddress(
    deployments?.contracts?.access?.address,
    process.env.NEXT_PUBLIC_ACCESS_CONTRACT,
    process.env.ACCESS_CONTRACT,
  ),
  vault: resolveContractAddress(
    deployments?.contracts?.vault?.address,
    process.env.NEXT_PUBLIC_VAULT_CONTRACT,
    process.env.VAULT_CONTRACT,
  ),
  scheduler: resolveContractAddress(
    deployments?.contracts?.scheduler?.address,
    process.env.NEXT_PUBLIC_SCHEDULER_CONTRACT,
    process.env.SCHEDULER_CONTRACT,
  ),
  passport: resolveContractAddress(
    deployments?.contracts?.passport?.address,
    process.env.NEXT_PUBLIC_PASSPORT_CONTRACT,
    process.env.PASSPORT_CONTRACT,
  ),
  policy: resolveContractAddress(
    process.env.NEXT_PUBLIC_POLICY_CONTRACT,
    process.env.POLICY_CONTRACT,
  ),
} as const;

export const POLICY_ACCESS_CONTRACT = resolveContractAddress(
  process.env.POLICY_ACCESS_CONTRACT,
  process.env.ACCESS_CONTRACT_SEPOLIA,
  process.env.NEXT_PUBLIC_POLICY_ACCESS_CONTRACT,
);
