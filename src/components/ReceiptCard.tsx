import type { Proof18Receipt } from "@/lib/types";

export function ReceiptCard({ receipt }: { receipt: Proof18Receipt }) {
  return (
    <div className="space-y-2 rounded-lg border p-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{receipt.type}</div>
        <div className="rounded bg-gray-100 px-2 py-1 text-xs">{receipt.policy.decision}</div>
      </div>
      <div>{receipt.action.description}</div>
      <div>
        Amount: {receipt.action.amount} {receipt.action.currency}
      </div>
      <div className="flex gap-3 text-xs">
        <a
          className="text-blue-600 hover:underline"
          href={receipt.execution.flowExplorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          Flow tx →
        </a>
        {receipt.storachaCid ? (
          <a
            className="text-purple-600 hover:underline"
            href={`https://storacha.link/ipfs/${receipt.storachaCid}`}
            target="_blank"
            rel="noreferrer"
          >
            Evidence →
          </a>
        ) : null}
      </div>
      <div className="text-xs text-gray-400">{receipt.timestamp}</div>
    </div>
  );
}
