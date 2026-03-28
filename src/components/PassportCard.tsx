import type { PassportState } from "@/lib/types";

export function PassportCard({ passport }: { passport: PassportState }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">📘 Passport</h3>
      <div className="text-sm text-gray-700">
        <div>
          Level: <span className="font-semibold">{passport.level}</span> (
          {passport.levelName})
        </div>
        <div>Weekly streak: {passport.weeklyStreak}</div>
        <div>Total actions: {passport.totalActions}</div>
        <div>Savings count: {passport.savingsCount}</div>
        <div>Approved subs: {passport.approvedSubs}</div>
        <div>Rejected actions: {passport.rejectedActions}</div>
      </div>

      <div className="rounded bg-gray-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span>Progress to {passport.progressToNext.nextLevelName}</span>
          <span className="font-semibold">{passport.progressToNext.percentComplete}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-white">
          <div
            className="h-2 rounded-full bg-indigo-600"
            style={{ width: `${Math.min(passport.progressToNext.percentComplete, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

