"use client";

import { ClawrenceChat } from "@/components/ClawrenceChat";
import { useAuthStore } from "@/store/authStore";
import { useFamilyStore } from "@/store/familyStore";

export default function TeenChatPage() {
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
    <ClawrenceChat
      session={session}
      familyId={familyId as `0x${string}`}
      teenAddress={session.address as `0x${string}`}
      teenName="Teen"
      guardianAddress={session.address}
      clawrencePublicKey={session.pkpPublicKey}
      clawrencePkpTokenId={session.pkpTokenId}
    />
  );
}

