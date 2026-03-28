import { getLitClient } from "./litClient";

export async function getTeenViemAccount(
  teenPkpPublicKey: string,
  sessionSigs: any
) {
  const client = await getLitClient();

  // PKP Viem Account — behaves like a normal viem account
  // but signatures are produced by the Lit Network
  const pkpAccount = await client.getPkpViemAccount({
    pkpPublicKey: teenPkpPublicKey,
    sessionSigs: sessionSigs,
  });

  return pkpAccount;
}

// Usage with Flow:
// const teenAccount = await getTeenViemAccount(teenPKP, sessionSigs);
// const txHash = await sponsoredWalletClient.writeContract({
//   account: teenAccount,
//   address: vaultAddress,
//   abi: VAULT_ABI,
//   functionName: "depositSavings",
//   value: parseEther("5"),
// });
