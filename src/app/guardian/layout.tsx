"use client";

import Link from "next/link";

import { AuthEntry } from "@/components/AuthEntry";
import { useAuthStore } from "@/store/authStore";

export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuthStore();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link href="/" className="font-bold">
            Proof18
          </Link>
          <nav className="flex gap-3 text-sm">
            <Link href="/guardian">Home</Link>
            <Link href="/guardian/setup">Policy</Link>
            <Link href="/guardian/inbox">Inbox</Link>
            <Link href="/guardian/family">Family</Link>
            <Link href="/guardian/activity">Activity</Link>
          </nav>
        </div>
      </header>

      {!session ? (
        <div className="mx-auto max-w-3xl p-6">
          <AuthEntry role="guardian" />
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl p-4">{children}</div>
    </div>
  );
}
