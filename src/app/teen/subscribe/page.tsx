"use client";

import { SubscriptionFlow } from "@/components/SubscriptionFlow";
import { useAuthStore } from "@/store/authStore";

export default function TeenSubscribePage() {
  const { session, family } = useAuthStore();
  const familyId = family?.familyId;
  const guardianAddress = family?.guardianAddress || "";

  if (!session || !familyId) {
    return (
      <div className="text-sm text-gray-600">
        Missing session or family. Complete onboarding first.
      </div>
    );
  }

  return (
    <SubscriptionFlow
      session={session}
      familyId={familyId as `0x${string}`}
      teenAddress={session.address as `0x${string}`}
      guardianAddress={guardianAddress}
      teenName="Teen"
      clawrencePublicKey={session.pkpPublicKey}
    />
  );
}
