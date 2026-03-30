"use client";

import { AuthEntry } from "@/components/AuthEntry";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/store/authStore";

export default function TeenLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore();

  // Show auth if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AuthEntry role="teen" />
        </div>
      </div>
    );
  }

  // Get user name from session or family
  const userName = session.phoneNumber
    ? `${session.role === 'teen' ? 'Teen' : 'User'} ${session.phoneNumber.slice(-4)}`
    : 'Teen User';

  return (
    <AppShell role="teen" userName={userName}>
      <div className="pb-20 md:pb-0">{children}</div>
    </AppShell>
  );
}
