"use client";

import { SubscriptionFlow } from "@/components/SubscriptionFlow";
import { useAuthStore } from "@/store/authStore";
import { useFamilyStore } from "@/store/familyStore";

export default function TeenSubscribePage() {
  const { session } = useAuthStore();
  const { familyId } = useFamilyStore();

  if (!session || !familyId) {
    return (
      <div className="text-sm text-gray-600">
        Missing session or familyId. Set `useAuthStore.session` and `useFamilyStore.familyId` first.
      </div>
    );
  }

  return (
    <SubscriptionFlow
      session={session}
      familyId={familyId as `0x${string}`}
      teenAddress={session.address as `0x${string}`}
      guardianAddress={session.address}
      teenName="Teen"
      clawrencePublicKey={session.pkpPublicKey}
    />
  );
}

