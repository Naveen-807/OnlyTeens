"use client";

import { SavingsFlow } from "@/components/SavingsFlow";
import { useAuthStore } from "@/store/authStore";

export default function TeenSavePage() {
  const { session, family } = useAuthStore();
  const familyId = family?.familyId;
  const guardianAddress = family?.guardianAddress || "";

  if (!session || !familyId || !family?.clawrencePkpPublicKey || !family?.clawrencePkpTokenId) {
    return (
      <div className="text-sm text-gray-600">
        Missing session, family, or Clawrence executor context. Complete onboarding first.
      </div>
    );
  }

  return (
    <SavingsFlow
      session={session}
      familyId={familyId as `0x${string}`}
      teenAddress={session.address as `0x${string}`}
      guardianAddress={guardianAddress}
      teenName="Teen"
      clawrencePublicKey={family.clawrencePkpPublicKey}
      clawrencePkpTokenId={family.clawrencePkpTokenId}
    />
  );
}
