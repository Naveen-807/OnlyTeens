"use client";

import { useEffect } from "react";

import { GuardianInbox } from "@/components/GuardianInbox";
import { useAuthStore } from "@/store/authStore";
import { useFamilyStore } from "@/store/familyStore";

export default function GuardianInboxPage() {
  const { session } = useAuthStore();
  const { familyId, pendingApprovals, refreshAll } = useFamilyStore();

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  if (!session || !familyId) {
    return (
      <div className="text-sm text-gray-600">
        Missing session or familyId. Set `useAuthStore.session` and `useFamilyStore.familyId` first.
      </div>
    );
  }

  return (
    <GuardianInbox
      requests={pendingApprovals}
      onApprove={async (id, note) => {
        await fetch("/api/approval/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: id, guardianNote: note, session }),
        });
        await refreshAll();
      }}
      onReject={async (id, note) => {
        await fetch("/api/approval/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: id, guardianNote: note, session }),
        });
        await refreshAll();
      }}
    />
  );
}

