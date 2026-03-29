"use client";

export function PermissionsProof({
  clawrencePkpAddress,
  safeExecutorCid,
  permittedScopes,
  guardianPkpAddress,
  teenPkpAddress,
  permissionState,
  onRevoke,
  revoking = false,
}: {
  clawrencePkpAddress: string;
  safeExecutorCid: string;
  permittedScopes: string[];
  guardianPkpAddress: string;
  teenPkpAddress: string;
  permissionState: "active" | "revoked";
  onRevoke?: () => void;
  revoking?: boolean;
}) {
  const litActionUrl = safeExecutorCid
    ? `https://ipfs.io/ipfs/${safeExecutorCid}`
    : undefined;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">🔐 Permission Proof</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            permissionState === "active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {permissionState === "active" ? "Executor permission active" : "Executor permission revoked"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Guardian PKP</span>
          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
            {guardianPkpAddress.slice(0, 8)}...{guardianPkpAddress.slice(-6)}
          </code>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Teen PKP</span>
          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
            {teenPkpAddress.slice(0, 8)}...{teenPkpAddress.slice(-6)}
          </code>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Clawrence PKP</span>
          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
            {clawrencePkpAddress.slice(0, 8)}...{clawrencePkpAddress.slice(-6)}
          </code>
        </div>

        <div className="border-t pt-3">
          <div className="mb-1 text-gray-600">Permitted Lit Action</div>
          {litActionUrl ? (
            <a
              href={litActionUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded bg-blue-50 px-2 py-2 text-xs text-blue-700 hover:bg-blue-100"
            >
              IPFS: {safeExecutorCid}
            </a>
          ) : (
            <code className="block rounded bg-gray-100 px-2 py-2 text-xs text-gray-500">
              Missing Lit Action CID
            </code>
          )}
        </div>

        <div>
          <div className="mb-1 text-gray-600">Allowed Scopes</div>
          {permittedScopes.map((scope) => (
            <span
              key={scope}
              className="mr-1 inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-800"
            >
              {scope}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Clawrence PKP <code>{clawrencePkpAddress}</code> can ONLY execute via Lit Action{" "}
          <code>{safeExecutorCid || "unconfigured"}</code>.
        </div>
      </div>

      {onRevoke ? (
        <button
          onClick={onRevoke}
          disabled={revoking || permissionState === "revoked"}
          className="w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {revoking ? "Revoking executor permission..." : "Revoke"}
        </button>
      ) : null}
    </div>
  );
}
