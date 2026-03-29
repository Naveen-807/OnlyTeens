"use client";

import { useEffect, useState } from "react";

import type { StoredReceipt } from "@/lib/receipts/receiptStore";
import { useAuthStore } from "@/store/authStore";

const decisionStyles: Record<string, string> = {
  GREEN: "bg-green-100 text-green-800",
  YELLOW: "bg-yellow-100 text-yellow-800",
  RED: "bg-red-100 text-red-800",
  BLOCKED: "bg-gray-200 text-gray-800",
};

export default function ActivityPage() {
  const { family } = useAuthStore();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [selected, setSelected] = useState<StoredReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!family?.familyId) return;
    fetch(`/api/receipts/list?familyId=${encodeURIComponent(family.familyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReceipts(data.receipts);
      })
      .finally(() => setIsLoading(false));
  }, [family?.familyId]);

  if (isLoading) {
    return <div className="max-w-md mx-auto p-6 text-center animate-pulse">Loading activity...</div>;
  }

  if (selected) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-indigo-600 hover:underline">
          ← Back to activity
        </button>

        <div className="border rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">{selected.description}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${decisionStyles[selected.decision]}`}>
              {selected.decision}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-bold">{selected.amount} FLOW</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Passport Level</p>
              <p className="font-bold">
                Level {selected.passportLevel}
                {selected.passportLeveledUp && " 🆙"}
              </p>
            </div>
          </div>

          {selected.clawrenceExplanation ? (
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs font-medium text-indigo-600 mb-1">🤖 Clawrence said:</p>
              <p className="text-sm">{selected.clawrenceExplanation}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-600">🔗 Verification</h3>

            {selected.flowTxHash ? (
              <a
                href={selected.flowExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 text-sm hover:bg-blue-100 transition"
              >
                <span>🌊</span>
                <div>
                  <p className="font-medium text-blue-700">Flow Transaction</p>
                  <p className="text-xs text-blue-500 font-mono">
                    {selected.flowTxHash.slice(0, 10)}...{selected.flowTxHash.slice(-8)}
                  </p>
                </div>
              </a>
            ) : null}

            {selected.zamaTxHash ? (
              <a
                href={`https://sepolia.etherscan.io/tx/${selected.zamaTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-emerald-50 rounded-lg p-3 text-sm hover:bg-emerald-100 transition"
              >
                <span>🔒</span>
                <div>
                  <p className="font-medium text-emerald-700">Zama Evaluation Transaction</p>
                  <p className="text-xs text-emerald-500 font-mono">
                    {selected.zamaTxHash.slice(0, 10)}...{selected.zamaTxHash.slice(-8)}
                  </p>
                </div>
              </a>
            ) : null}

            {selected.storachaCid ? (
              <a
                href={selected.storachaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-purple-50 rounded-lg p-3 text-sm hover:bg-purple-100 transition"
              >
                <span>📦</span>
                <div>
                  <p className="font-medium text-purple-700">Storacha Receipt</p>
                  <p className="text-xs text-purple-500 font-mono">CID: {selected.storachaCid}</p>
                </div>
              </a>
            ) : null}

            {selected.litActionCid ? (
              <a
                href={`https://ipfs.io/ipfs/${selected.litActionCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-orange-50 rounded-lg p-3 text-sm hover:bg-orange-100 transition"
              >
                <span>🔐</span>
                <div>
                  <p className="font-medium text-orange-700">Lit Safe Executor</p>
                  <p className="text-xs text-orange-500 font-mono">CID: {selected.litActionCid}</p>
                </div>
              </a>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              This receipt exists at CID <code>{selected.storachaCid || "n/a"}</code> and references Flow tx <code>{selected.flowTxHash || "n/a"}</code>.
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            {new Date(selected.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-lg font-bold">📋 Activity & Evidence</h2>

      {receipts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">🌱</p>
          <p>No activity yet</p>
          <p className="text-xs mt-1">Your financial actions will appear here with full verification links</p>
        </div>
      ) : (
        receipts.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="w-full text-left border rounded-lg p-3 hover:bg-gray-50 transition space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{r.description}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${decisionStyles[r.decision]}`}>
                {r.decision}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{r.amount} FLOW</span>
              <span>{new Date(r.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2 text-[10px]">
              {r.flowTxHash ? <span className="text-blue-500">🌊 Flow</span> : null}
              {r.storachaCid ? <span className="text-purple-500">📦 Storacha</span> : null}
              {r.litActionCid ? <span className="text-orange-500">🔐 Lit</span> : null}
              {r.zamaTxHash ? <span className="text-green-500">🔒 Zama</span> : null}
            </div>
          </button>
        ))
      )}
    </div>
  );
}
