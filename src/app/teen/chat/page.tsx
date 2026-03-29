"use client";

import { ClawrenceChat } from "@/components/ClawrenceChat";
import { useAuthStore } from "@/store/authStore";

export default function TeenChatPage() {
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
    <ClawrenceChat
      session={session}
      familyId={familyId as `0x${string}`}
      teenAddress={session.address as `0x${string}`}
      teenName="Teen"
      guardianAddress={guardianAddress}
      clawrencePublicKey={family.clawrencePkpPublicKey}
      clawrencePkpTokenId={family.clawrencePkpTokenId}
    />
  );
}
