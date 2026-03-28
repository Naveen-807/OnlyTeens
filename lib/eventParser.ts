import { publicClient } from "./flowGasless";
import { parseAbiItem, decodeEventLog } from "viem";

const VAULT_EVENTS = {
  SavingsDeposit: parseAbiItem(
    "event SavingsDeposit(address indexed teen, uint256 amount, uint256 newBalance, uint256 timestamp)"
  ),
  SubscriptionFunded: parseAbiItem(
    "event SubscriptionFunded(address indexed teen, string serviceName, uint256 amount, uint256 timestamp)"
  ),
  PassportUpdated: parseAbiItem(
    "event PassportUpdated(address indexed teen, uint256 oldLevel, uint256 newLevel, uint256 timestamp)"
  ),
};

export async function parseFlowTxReceipt(txHash: `0x${string}`) {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  const events: any[] = [];

  for (const log of receipt.logs) {
    try {
      for (const [name, abi] of Object.entries(VAULT_EVENTS)) {
        try {
          const decoded = decodeEventLog({
            abi: [abi],
            data: log.data,
            topics: log.topics,
          });
          events.push({
            name,
            args: decoded.args,
            blockNumber: receipt.blockNumber,
            txHash: receipt.transactionHash,
          });
        } catch { /* not this event */ }
      }
    } catch { /* skip */ }
  }

  return {
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
    gasUsed: receipt.gasUsed.toString(),
    events,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${receipt.transactionHash}`,
  };
}
