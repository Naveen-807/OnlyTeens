"use client";

import { AuthEntry } from "@/components/AuthEntry";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function TeenLayout({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const session = useAuthStore((state) => state.session);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-background p-6">
        <div className="flex items-center gap-3 rounded-[1.5rem] border border-border/30 bg-card/80 px-5 py-4 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Restoring your session...
        </div>
      </div>
    );
  }

  // Show auth if not logged in
  if (!session || session.role !== "teen") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-background p-6">
        <div className="w-full max-w-md">
          <AuthEntry role="teen" />
        </div>
      </div>
    );
  }

  // Get user name from session or family
  const userName = session.phoneNumber
    ? `Teen ${session.phoneNumber.slice(-4)}`
    : 'Teen User';

  return (
    <AppShell role="teen" userName={userName}>
      <div className="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
    </AppShell>
  );
}
