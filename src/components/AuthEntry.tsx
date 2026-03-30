"use client";

import { PhoneOtpAuthCard } from "@/components/PhoneOtpAuthCard";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/lib/types";

export function AuthEntry({ role }: { role: Role }) {
  const login = useAuthStore((state) => state.login);

  return (
    <PhoneOtpAuthCard
      role={role}
      title={`Connect as ${role}`}
      subtitle="Verify your phone with SMS OTP, then mint a real Lit-backed session."
      submitLabel={`Verify ${role} login`}
      onSession={async (session) => {
        await login({
          role,
          pkpPublicKey: session.pkpPublicKey,
          pkpTokenId: session.pkpTokenId,
          pkpAddress: session.pkpAddress,
          phoneNumber: session.phoneNumber,
          authMethod: session.authMethod,
          address: session.address,
        });
      }}
    />
  );
}
