import "server-only";

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { FLOW_TESTNET } from "@/lib/constants";
import { normalizePrivateKeyEnv } from "@/lib/runtime/privateKey";

export const flowPublicClient = createPublicClient({
  chain: FLOW_TESTNET,
  transport: http(FLOW_TESTNET.rpcUrls.default.http[0]),
});

const rpcUrl = process.env.GAS_FREE_RPC_URL || FLOW_TESTNET.rpcUrls.default.http[0];

export const flowWalletClient = createWalletClient({
  chain: FLOW_TESTNET,
  transport: http(rpcUrl),
});

export function getServiceAccount() {
  const envName = process.env.DEPLOYER_PRIVATE_KEY
    ? "DEPLOYER_PRIVATE_KEY"
    : process.env.FLOW_TESTNET_PRIVATE_KEY
      ? "FLOW_TESTNET_PRIVATE_KEY"
      : "";
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.FLOW_TESTNET_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY or FLOW_TESTNET_PRIVATE_KEY");
  }

  return privateKeyToAccount(normalizePrivateKeyEnv(envName, privateKey));
}
