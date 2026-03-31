/* eslint-disable no-console */
import { createPublicClient, http, formatEther } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  });

  // Get evaluator account from private key
  const evalKey = process.env.ZAMA_EVALUATOR_PRIVATE_KEY;
  const normalizedKey = evalKey?.startsWith("0x") ? evalKey : `0x${evalKey}`;
  const evalAccount = privateKeyToAccount(normalizedKey as `0x${string}`);
  console.log("Evaluator address:", evalAccount.address);

  // Check balance
  const balance = await sepoliaClient.getBalance({ address: evalAccount.address });
  console.log("Balance:", formatEther(balance), "ETH");

  // Check policy contract
  const policyAddr = process.env.NEXT_PUBLIC_POLICY_CONTRACT;
  console.log("Policy contract:", policyAddr);

  // Check code exists
  const code = await sepoliaClient.getCode({ address: policyAddr as `0x${string}` });
  console.log("Contract has code:", code.length > 2);

  if (Number(balance) === 0) {
    console.log("\n⚠️  Warning: Evaluator account has no Sepolia ETH - policy will use heuristic fallback");
  }
}

main().catch(console.error);
