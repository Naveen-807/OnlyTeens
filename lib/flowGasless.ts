import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Flow EVM Testnet chain definition
export const flowTestnet = {
  id: 545,
  name: "Flow EVM Testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.evm.nodes.onflow.org"] },
    // Your self-hosted gas-free endpoint (see Flow docs for setup)
    gasFree: { http: [process.env.GAS_FREE_RPC_URL!] },
  },
  blockExplorers: {
    default: {
      name: "Flowscan",
      url: "https://evm-testnet.flowscan.io",
    },
  },
} as const;

// Service account that sponsors gas
const serviceAccount = privateKeyToAccount(
  process.env.SERVICE_ACCOUNT_KEY as `0x${string}`
);

// Public client for reads (standard RPC)
export const publicClient = createPublicClient({
  chain: flowTestnet,
  transport: http(flowTestnet.rpcUrls.default.http[0]),
});

// Wallet client for writes through gas-free endpoint
export const sponsoredWalletClient = createWalletClient({
  chain: flowTestnet,
  transport: http(process.env.GAS_FREE_RPC_URL!),
});

// ─── Sponsored savings deposit ───
export async function sponsoredSavingsDeposit(
  teenAccount: any,
  contractAddress: `0x${string}`,
  amountInFlow: string
) {
  const txHash = await sponsoredWalletClient.writeContract({
    account: teenAccount,
    address: contractAddress,
    abi: VAULT_ABI,
    functionName: "depositSavings",
    value: parseEther(amountInFlow),
  });

  return {
    txHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
  };
}
