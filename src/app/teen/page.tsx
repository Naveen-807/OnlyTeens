"use client";

import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { useAuthStore } from "@/store/authStore";

export default function TeenDashboard() {
  const { session, family } = useAuthStore();
  const { balances, passport, receipts, pendingApprovals, isLoading, refresh } =
    useDashboardData();

  if (!session || !family) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Welcome to Proof18</h2>
        <p className="text-gray-500">Please log in to continue.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="animate-pulse text-gray-400">Loading your dashboard...</div>
      </div>
    );
  }

  const progressPercent = passport?.progressToNext?.percentComplete ?? 0;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Hey there 👋</h1>
          <p className="text-sm text-gray-500">
            {passport
              ? `Level ${passport.level}: ${passport.levelName}`
              : "Getting started..."}
          </p>
        </div>
        {passport && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            🔥 {passport.weeklyStreak}wk streak
          </span>
        )}
      </div>

      {/* Passport Progress */}
      {passport && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex justify-between text-sm mb-2">
            <span>{passport.levelName}</span>
            <span>{passport.progressToNext.nextLevelName}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2.5">
            <div
              className="bg-white rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs mt-1 opacity-80">
            {passport.progressToNext.remaining} actions to{" "}
            {passport.progressToNext.nextLevelName}
          </p>
        </div>
      )}

      {/* Balances */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Spend</p>
          <p className="text-lg font-bold text-green-700">
            {balances?.spendable || "0"}{" "}
            <span className="text-xs">FLOW</span>
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Saved</p>
          <p className="text-lg font-bold text-blue-700">
            {balances?.savings || "0"}{" "}
            <span className="text-xs">FLOW</span>
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Subs</p>
          <p className="text-lg font-bold text-purple-700">
            {balances?.subscriptionReserve || "0"}{" "}
            <span className="text-xs">FLOW</span>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: "💰", label: "Save", href: "/teen/save" },
          { icon: "📱", label: "Subscribe", href: "/teen/subscribe" },
          { icon: "🤖", label: "Ask CL", href: "/teen/chat" },
          { icon: "📋", label: "Activity", href: "/teen/activity" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        ))}
      </div>

      {/* Pending Requests */}
      {pendingApprovals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            ⏳ Pending Approval ({pendingApprovals.length})
          </h3>
          {pendingApprovals.map((req) => (
            <div
              key={req.id}
              className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 mb-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{req.description}</span>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                  {req.policyDecision}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Waiting for guardian...
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-600">
            Recent Activity
          </h3>
          <a
            href="/teen/activity"
            className="text-xs text-indigo-600 hover:underline"
          >
            View all →
          </a>
        </div>
        {receipts.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-3xl mb-2">🌱</p>
            <p className="text-sm">No activity yet. Start by saving!</p>
          </div>
        ) : (
          receipts.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className="flex justify-between items-center py-2 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{r.description}</p>
                <p className="text-xs text-gray-400">
                  {new Date(r.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{r.amount} FLOW</p>
                <div className="flex gap-1 mt-0.5">
                  {r.flowTxHash && (
                    <a
                      href={r.flowExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      🌊 Tx
                    </a>
                  )}
                  {r.storachaCid && (
                    <a
                      href={r.storachaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-purple-500 hover:underline"
                    >
                      📦 CID
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Refresh */}
      <button
        onClick={refresh}
        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
