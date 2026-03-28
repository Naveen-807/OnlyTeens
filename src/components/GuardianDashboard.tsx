"use client";

import Link from "next/link";

export function GuardianDashboard() {
  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold">Guardian Dashboard</h1>
      <div className="grid gap-2">
        <Link className="rounded-lg border p-3 hover:bg-gray-50" href="/guardian/setup">
          🔒 Policy setup (Zama)
        </Link>
        <Link className="rounded-lg border p-3 hover:bg-gray-50" href="/guardian/inbox">
          📬 Approval inbox
        </Link>
        <Link className="rounded-lg border p-3 hover:bg-gray-50" href="/guardian/activity">
          🧾 Activity
        </Link>
        <Link className="rounded-lg border p-3 hover:bg-gray-50" href="/guardian/family">
          👨‍👩‍👧 Family / Permissions
        </Link>
      </div>
    </div>
  );
}

