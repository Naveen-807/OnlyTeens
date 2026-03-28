import { useState } from "react";

interface ApprovalRequest {
  id: string;
  teenName: string;
  actionType: string;
  description: string;
  amount: number;
  currency: string;
  isRecurring: boolean;
  policyDecision: "YELLOW" | "RED";
  clawrenceExplanation: string;
  guardianExplanation: string;
  teenPassportLevel: number;
  teenStreak: number;
  requestedAt: string;
}

export function GuardianInbox({
  requests,
  onApprove,
  onReject,
  decryptedThresholds,
}: {
  requests: ApprovalRequest[];
  onApprove: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  decryptedThresholds?: { singleCap: number; recurringCap: number };
}) {
  const [processing, setProcessing] = useState<string | null>(null);

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        📬 Approval Inbox
        {requests.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        )}
      </h2>

      {/* Guardian's decrypted thresholds (Zama selective decryption) */}
      {decryptedThresholds && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-gray-600 mb-1">🔓 Your Family Limits</p>
          <div className="flex gap-4">
            <span>Single: ₹{decryptedThresholds.singleCap}</span>
            <span>Monthly recurring: ₹{decryptedThresholds.recurringCap}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Decrypted for you only — your teen sees only the classification
          </p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">✨</p>
          <p>No pending requests</p>
        </div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="border rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {req.teenName} wants to {req.actionType}
                </p>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold ${
                  req.policyDecision === "RED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {req.policyDecision}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-600 mb-1">🤖 Clawrence says:</p>
              <p>{req.guardianExplanation}</p>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {req.currency}{req.amount}
                {req.isRecurring ? "/month" : ""}
              </span>
              <span>
                Passport Lv.{req.teenPassportLevel} • {req.teenStreak}wk streak
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setProcessing(req.id);
                  await onApprove(req.id);
                  setProcessing(null);
                }}
                disabled={processing === req.id}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Approve
              </button>
              <button
                onClick={async () => {
                  const note = prompt("Reason for declining (optional):");
                  setProcessing(req.id);
                  await onReject(req.id, note || "Guardian declined");
                  setProcessing(null);
                }}
                disabled={processing === req.id}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                ❌ Decline
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
