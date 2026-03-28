"use client";

import Link from "next/link";

import { useAuthStore } from "@/store/authStore";

export default function TeenLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link href="/" className="font-bold">
            Proof18
          </Link>
          <nav className="flex gap-3 text-sm">
            <Link href="/teen">Home</Link>
            <Link href="/teen/save">Save</Link>
            <Link href="/teen/subscribe">Subscribe</Link>
            <Link href="/teen/chat">Chat</Link>
            <Link href="/teen/activity">Activity</Link>
            <Link href="/teen/passport">Passport</Link>
          </nav>
        </div>
      </header>

      {!session ? (
        <div className="mx-auto max-w-3xl p-6 text-sm text-gray-600">
          No session yet. For the hackathon MVP, POST to `api/auth/teen` to mint a PKP and store the session in `useAuthStore`.
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl p-4">{children}</div>
    </div>
  );
}

