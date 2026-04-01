"use client";

import { AuthEntry } from "@/components/AuthEntry";
import { DefiPortfolio } from "@/components/DefiPortfolio";
import { useAuthStore } from "@/store/authStore";

export default function TeenDefiPage() {
  const { session, family } = useAuthStore();
  const familyId = family?.familyId;
  const guardianAddress = family?.guardianAddress || "";
  const teenName = session?.phoneNumber ? `Teen ${session.phoneNumber.slice(-4)}` : "Teen";

  if (!session || !familyId) {
    return (
      <div className="mx-auto max-w-md p-4">
        <AuthEntry role="teen" />
      </div>
    );
  }

  return (
    <DefiPortfolio
      session={session}
      familyId={familyId as `0x${string}`}
      teenAddress={session.address as `0x${string}`}
      guardianAddress={guardianAddress}
      teenName={teenName}
      clawrencePublicKey={session.pkpPublicKey}
      clawrencePkpTokenId={session.pkpTokenId}
    />
  );
}