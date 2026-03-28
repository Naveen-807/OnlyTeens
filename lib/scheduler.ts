import { publicClient, sponsoredWalletClient } from "./flowGasless";

export async function createWeeklySavings(
  teenAccount: any,
  schedulerAddress: `0x${string}`,
  amountWei: bigint
) {
  const txHash = await sponsoredWalletClient.writeContract({
    account: teenAccount,
    address: schedulerAddress,
    abi: SCHEDULER_ABI,
    functionName: "createSchedule",
    args: [
      teenAccount.address,
      amountWei,
      BigInt(604800), // 1 week in seconds
      "weekly-savings",
    ],
  });

  return {
    txHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
  };
}

export async function createSubscriptionSchedule(
  teenAccount: any,
  schedulerAddress: `0x${string}`,
  serviceName: string,
  monthlyAmountWei: bigint
) {
  const txHash = await sponsoredWalletClient.writeContract({
    account: teenAccount,
    address: schedulerAddress,
    abi: SCHEDULER_ABI,
    functionName: "createSchedule",
    args: [
      teenAccount.address,
      monthlyAmountWei,
      BigInt(2592000), // ~30 days
      serviceName,
    ],
  });

  return { txHash };
}
