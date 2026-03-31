import fs from "node:fs";
import path from "node:path";

export type DeploymentContractKey =
  | "access"
  | "vault"
  | "scheduler"
  | "passport"
  | "policy";

export interface DeploymentContractRecord {
  name: string;
  chainId: number;
  network: string;
  address: string;
  explorerUrl?: string;
  deploymentTxHash?: string;
  lastVerifiedAt?: string;
}

export interface DeploymentArtifact {
  generatedAt?: string;
  contracts: Partial<Record<DeploymentContractKey, DeploymentContractRecord>>;
}

type LegacyDeploymentShape = {
  network?: string;
  chainId?: number;
  timestamp?: string;
  contracts?: Partial<
    Record<
      Exclude<DeploymentContractKey, "policy">,
      {
        address?: string;
        explorer?: string;
        explorerUrl?: string;
        deploymentTxHash?: string;
      }
    >
  > & {
    policy?: {
      address?: string;
      explorer?: string;
      explorerUrl?: string;
      deploymentTxHash?: string;
      chainId?: number;
      network?: string;
    };
  };
};

const DEPLOYMENTS_FILE = path.join(process.cwd(), "deployments.json");
const DEPLOYMENT_HEALTH_FILE = path.join(process.cwd(), "deployment-health.json");

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fileExists(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function normalizeLegacyArtifact(input: LegacyDeploymentShape | null): DeploymentArtifact | null {
  if (!input?.contracts) return null;

  const defaults = {
    network: input.network || "Unknown",
    chainId: input.chainId || 0,
  };

  const contracts = Object.entries(input.contracts).reduce<DeploymentArtifact["contracts"]>(
    (acc, [rawKey, value]) => {
      const key = rawKey as DeploymentContractKey;
      if (!value?.address) return acc;
      const policyValue = value as {
        network?: string;
        chainId?: number;
      };
      acc[key] = {
        name: key,
        network:
          key === "policy"
            ? policyValue?.network || "Ethereum Sepolia"
            : defaults.network,
        chainId:
          key === "policy"
            ? policyValue?.chainId || 11155111
            : defaults.chainId,
        address: value.address,
        explorerUrl: value.explorerUrl || value.explorer,
        deploymentTxHash: value.deploymentTxHash,
      };
      return acc;
    },
    {},
  );

  return {
    generatedAt: input.timestamp,
    contracts,
  };
}

export function readDeploymentsArtifact(): DeploymentArtifact | null {
  const raw = readJson<LegacyDeploymentShape>(DEPLOYMENTS_FILE);
  return normalizeLegacyArtifact(raw);
}

export function readDeploymentHealthArtifact(): DeploymentArtifact | null {
  return readJson<DeploymentArtifact>(DEPLOYMENT_HEALTH_FILE);
}

export function resolveDeploymentContract(
  key: DeploymentContractKey,
): DeploymentContractRecord | null {
  const health = readDeploymentHealthArtifact();
  if (health?.contracts[key]?.address) {
    return health.contracts[key] || null;
  }

  const deployments = readDeploymentsArtifact();
  return deployments?.contracts[key] || null;
}

export function writeDeploymentHealthArtifact(artifact: DeploymentArtifact): void {
  fs.writeFileSync(DEPLOYMENT_HEALTH_FILE, JSON.stringify(artifact, null, 2));
}
