/* eslint-disable no-console */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { createPublicClient, http } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000";

type DeploymentShape = {
  contracts?: {
    access?: { address?: string };
    vault?: { address?: string };
    scheduler?: { address?: string };
    passport?: { address?: string };
  };
};

function getDeploymentContract(name: "access" | "vault" | "scheduler" | "passport") {
  const deploymentFile = resolve(process.cwd(), "deployments.json");
  if (!existsSync(deploymentFile)) return undefined;
  const content = JSON.parse(readFileSync(deploymentFile, "utf-8")) as DeploymentShape;
  return content.contracts?.[name]?.address;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function contractAddressFromEnvOrDeploy(
  envName: string,
  deployName?: "access" | "vault" | "scheduler" | "passport",
) {
  const envValue = process.env[envName];
  if (envValue) return envValue;
  if (!deployName) return undefined;
  return getDeploymentContract(deployName);
}

function assertNonZeroAddress(name: string, value?: string) {
  if (!value || value.toLowerCase() === ZERO) {
    throw new Error(`Contract ${name} is missing or zero address`);
  }
}

async function assertRpcReachable(label: string, url: string) {
  const chain =
    label === "FLOW"
      ? {
          id: 545,
          name: "Flow EVM Testnet",
          nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
          rpcUrls: { default: { http: [url] } },
        }
      : {
          id: 11155111,
          name: "Sepolia",
          nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
          rpcUrls: { default: { http: [url] } },
        };

  const client = createPublicClient({ chain, transport: http(url) });
  const block = await client.getBlockNumber();
  console.log(`  ${label} RPC reachable (latest block ${block})`);
}

async function assertLitActionCidResolvable(cid: string) {
  const url = `https://ipfs.io/ipfs/${cid}`;
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`Lit Action CID not resolvable on ipfs.io: ${cid}`);
  }
  console.log("  Lit Action CID resolvable");
}

function assertStorachaCreds() {
  requiredEnv("STORACHA_KEY");
  requiredEnv("STORACHA_PROOF");
  console.log("  Storacha credentials present");
}

function assertEvaluatorKeyFundedHint() {
  requiredEnv("ZAMA_EVALUATOR_PRIVATE_KEY");
  console.log("  Zama evaluator private key configured (funding must be verified onchain)");
}

async function main() {
  console.log("Running Proof18 preflight...");

  const access = contractAddressFromEnvOrDeploy("NEXT_PUBLIC_ACCESS_CONTRACT", "access");
  const vault = contractAddressFromEnvOrDeploy("NEXT_PUBLIC_VAULT_CONTRACT", "vault");
  const scheduler = contractAddressFromEnvOrDeploy(
    "NEXT_PUBLIC_SCHEDULER_CONTRACT",
    "scheduler",
  );
  const passport = contractAddressFromEnvOrDeploy("NEXT_PUBLIC_PASSPORT_CONTRACT", "passport");
  const policy = process.env.NEXT_PUBLIC_POLICY_CONTRACT || process.env.POLICY_CONTRACT;

  assertNonZeroAddress("access", access);
  assertNonZeroAddress("vault", vault);
  assertNonZeroAddress("scheduler", scheduler);
  assertNonZeroAddress("passport", passport);
  assertNonZeroAddress("policy", policy);
  console.log("  Contract addresses look configured");

  const flowRpc = process.env.GAS_FREE_RPC_URL || "https://testnet.evm.nodes.onflow.org";
  const sepoliaRpc = requiredEnv("SEPOLIA_RPC_URL");
  await assertRpcReachable("FLOW", flowRpc);
  await assertRpcReachable("SEPOLIA", sepoliaRpc);

  const actionCid =
    process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || process.env.SAFE_EXECUTOR_CID;
  if (!actionCid) throw new Error("SAFE_EXECUTOR_CID is missing");
  await assertLitActionCidResolvable(actionCid);

  assertStorachaCreds();
  assertEvaluatorKeyFundedHint();

  console.log("Preflight passed.");
}

main().catch((error) => {
  console.error(`Preflight failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

