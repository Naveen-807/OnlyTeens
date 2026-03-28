interface ActivityItem {
  id: string;
  type: "savings" | "subscription" | "approval" | "passport_update";
  description: string;
  amount: string;
  decision: "GREEN" | "YELLOW" | "RED" | "BLOCKED";
  flowTxHash: string;
  storachaCid: string;
  passportLevel: number;
  timestamp: string;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const decisionColors = {
    GREEN: "bg-green-100 text-green-800",
    YELLOW: "bg-yellow-100 text-yellow-800",
    RED: "bg-red-100 text-red-800",
    BLOCKED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Activity</h2>
      {items.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{item.description}</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${decisionColors[item.decision]}`}>
              {item.decision}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            {item.amount} FLOW • Passport Level {item.passportLevel}
          </div>

          {/* ─── Judge-visible proof links ─── */}
          <div className="flex gap-3 text-xs">
            {item.flowTxHash && (
              <a
                href={`https://evm-testnet.flowscan.io/tx/${item.flowTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                🌊 Flow Tx →
              </a>
            )}
            {item.storachaCid && (
              <a
                href={`https://storacha.link/ipfs/${item.storachaCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                📦 Receipt CID →
              </a>
            )}
          </div>

          <div className="text-xs text-gray-400">
            {new Date(item.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
