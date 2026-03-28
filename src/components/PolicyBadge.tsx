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
  } as const;

  const config = labels[decision];

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{config.emoji}</span>
        <div>
          <div className="font-semibold">{config.text}</div>
          <div className="text-sm text-gray-500">{config.desc}</div>
        </div>
      </div>

      {showGuardianDetail && guardianReason ? (
        <div className="mt-2 rounded bg-gray-50 p-2 text-sm">
          <span className="font-medium">Detail: </span>
          {guardianReason}
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-400">🔒 Detailed rules are private</div>
      )}
    </div>
  );
}

