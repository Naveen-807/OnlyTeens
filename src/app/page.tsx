import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Proof18</h1>
      <p className="mt-2 text-gray-600">
        Teen-first mini-bank with AI guidance (Flow + Lit + Zama + Storacha).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/teen"
          className="rounded-xl border p-5 hover:bg-gray-50"
        >
          <div className="text-lg font-semibold">Teen</div>
          <div className="mt-1 text-sm text-gray-600">
            Save, subscribe, chat with Clawrence, and track your Passport.
          </div>
        </Link>

        <Link
          href="/guardian"
          className="rounded-xl border p-5 hover:bg-gray-50"
        >
          <div className="text-lg font-semibold">Guardian</div>
          <div className="mt-1 text-sm text-gray-600">
            Set encrypted policy, approve requests, and audit receipts.
          </div>
        </Link>
      </div>
    </main>
  );
}
