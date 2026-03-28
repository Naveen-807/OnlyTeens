export function PolicyBadge({
  decision,
  showGuardianDetail,
  guardianReason,
}: {
  decision: "GREEN" | "YELLOW" | "RED" | "BLOCKED";
  showGuardianDetail: boolean;
  guardianReason?: string;
}) {
  const labels = {
    GREEN: { text: "Auto-Approved", emoji: "✅", desc: "Within your limits" },
    YELLOW: { text: "Needs Review", emoji: "⚠️", desc: "Guardian will review" },
    RED: { text: "Approval Required", emoji: "🔴", desc: "Ask your guardian" },
    BLOCKED: { text: "Not Allowed", emoji: "🚫", desc: "This action is blocked" },
  };

  const config = labels[decision];

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{config.emoji}</span>
        <div>
          <div className="font-semibold">{config.text}</div>
          <div className="text-sm text-gray-500">{config.desc}</div>
        </div>
      </div>

      {/* Guardian sees more detail — Zama selective decryption */}
      {showGuardianDetail && guardianReason && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium">Detail: </span>
          {guardianReason}
        </div>
      )}

      {/* Teen sees only the classification */}
      {!showGuardianDetail && (
        <div className="mt-2 text-xs text-gray-400">
          🔒 Detailed rules are private
        </div>
      )}
    </div>
  );
}
