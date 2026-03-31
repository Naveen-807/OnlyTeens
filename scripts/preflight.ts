/* eslint-disable no-console */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config as loadEnv } from "dotenv";

import { LIVE_REQUIRED_ENV } from "../src/lib/runtime/config";
import { normalizePrivateKeyEnv } from "../src/lib/runtime/privateKey";

const ZERO = "0x0000000000000000000000000000000000000000";

for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }
}

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

function isLiveMode(): boolean {
  return process.env.PROOF18_LIVE_MODE === "true";
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

async function assertWalletLooksFunded(
  label: string,
  rpcUrl: string,
  accountAddress: `0x${string}`,
  chain: "FLOW" | "SEPOLIA",
) {
  const resolvedChain =
    chain === "FLOW"
      ? {
          id: 545,
          name: "Flow EVM Testnet",
          nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } },
        }
      : {
          id: 11155111,
          name: "Sepolia",
          nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } },
        };

  const client = createPublicClient({ chain: resolvedChain, transport: http(rpcUrl) });
  const balance = await client.getBalance({ address: accountAddress });
  if (balance <= 0n) {
    throw new Error(`${label} wallet ${accountAddress} has zero native balance`);
  }
  console.log(`  ${label} wallet funded (${balance.toString()} wei)`);
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

function getPrivateKeyAccount(envName: string, fallback?: string) {
  const raw = process.env[envName] || fallback;
  if (!raw) return null;
  return privateKeyToAccount(normalizePrivateKeyEnv(envName, raw));
}

function assertVincentConfig() {
  requiredEnv("VINCENT_API_KEY");
  requiredEnv("VINCENT_APP_ID");
  requiredEnv("VINCENT_APP_VERSION");
  requiredEnv("VINCENT_REDIRECT_URI");
  requiredEnv("VINCENT_JWT_AUDIENCE");
  normalizePrivateKeyEnv("VINCENT_DELEGATEE_PRIVATE_KEY", process.env.VINCENT_DELEGATEE_PRIVATE_KEY);
  console.log("  Vincent app auth surface configured");
}

function assertErc8004Config() {
  requiredEnv("ERC8004_IDENTITY_REGISTRY_ADDRESS");
  requiredEnv("ERC8004_REPUTATION_REGISTRY_ADDRESS");
  requiredEnv("ERC8004_VALIDATION_REGISTRY_ADDRESS");
  assertNonZeroAddress("erc8004IdentityRegistry", process.env.ERC8004_IDENTITY_REGISTRY_ADDRESS);
  assertNonZeroAddress("erc8004ReputationRegistry", process.env.ERC8004_REPUTATION_REGISTRY_ADDRESS);
  assertNonZeroAddress("erc8004ValidationRegistry", process.env.ERC8004_VALIDATION_REGISTRY_ADDRESS);
  normalizePrivateKeyEnv("CALMA_OPERATOR_PRIVATE_KEY", process.env.CALMA_OPERATOR_PRIVATE_KEY);
  console.log("  ERC-8004 registry surface configured");
}

function assertMintingKeys() {
  normalizePrivateKeyEnv("LIT_MINTING_KEY", process.env.LIT_MINTING_KEY);
  console.log("  Lit minting key format looks valid");

  const flowKey = process.env.FLOW_TESTNET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (flowKey) {
    normalizePrivateKeyEnv("FLOW_TESTNET_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY", flowKey);
    console.log("  Flow service key format looks valid");
  }
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
  assertMintingKeys();
  const evaluator = getPrivateKeyAccount(
    "ZAMA_EVALUATOR_PRIVATE_KEY",
    process.env.ZAMA_PRIVATE_KEY,
  );
  if (evaluator) {
    console.log("  Zama evaluator private key configured");
  }

  if (isLiveMode()) {
    console.log("  Live mode enabled: validating strict env surface");
    for (const key of [
      ...LIVE_REQUIRED_ENV.flow,
      ...LIVE_REQUIRED_ENV.zama,
      ...LIVE_REQUIRED_ENV.chipotle,
      ...LIVE_REQUIRED_ENV.vincent,
      ...LIVE_REQUIRED_ENV.erc8004,
      ...LIVE_REQUIRED_ENV.storageAndAi,
    ]) {
      requiredEnv(key);
    }

    assertNonZeroAddress("zamaKms", process.env.ZAMA_KMS_CONTRACT_ADDRESS);
    assertNonZeroAddress("zamaAcl", process.env.ZAMA_ACL_CONTRACT_ADDRESS);
    assertVincentConfig();
    assertErc8004Config();

    const flowOperator = getPrivateKeyAccount(
      "FLOW_TESTNET_PRIVATE_KEY",
      process.env.DEPLOYER_PRIVATE_KEY,
    );
    if (!flowOperator) {
      throw new Error("Missing FLOW_TESTNET_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY");
    }
    await assertWalletLooksFunded("Flow operator", flowRpc, flowOperator.address, "FLOW");

    if (!evaluator) {
      throw new Error("Missing ZAMA_EVALUATOR_PRIVATE_KEY");
    }
    await assertWalletLooksFunded("Zama evaluator", sepoliaRpc, evaluator.address, "SEPOLIA");

    const calmaOperator = getPrivateKeyAccount("CALMA_OPERATOR_PRIVATE_KEY");
    if (!calmaOperator) {
      throw new Error("Missing CALMA_OPERATOR_PRIVATE_KEY");
    }
    await assertWalletLooksFunded("Calma operator", sepoliaRpc, calmaOperator.address, "SEPOLIA");
  }

  console.log("Preflight passed.");
}

main().catch((error) => {
  console.error(`Preflight failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
