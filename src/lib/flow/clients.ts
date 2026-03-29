import "server-only";

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { FLOW_TESTNET } from "@/lib/constants";

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
  const privateKey =
    process.env.FLOW_TESTNET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Missing FLOW_TESTNET_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY");
  }

  return privateKeyToAccount(privateKey as `0x${string}`);
}
