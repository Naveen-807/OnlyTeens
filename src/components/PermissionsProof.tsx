export function PermissionsProof({
  clawrencePkpAddress,
  safeExecutorCid,
  permittedScopes,
  guardianPkpAddress,
  teenPkpAddress,
}: {
  clawrencePkpAddress: string;
  safeExecutorCid: string;
  permittedScopes: string[];
  guardianPkpAddress: string;
  teenPkpAddress: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">🔐 Permission Proof</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Guardian PKP</span>
          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
            {guardianPkpAddress.slice(0, 8)}...{guardianPkpAddress.slice(-6)}
          </code>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Teen PKP</span>
          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
            {teenPkpAddress.slice(0, 8)}...{teenPkpAddress.slice(-6)}
          </code>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Clawrence PKP</span>
          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
            {clawrencePkpAddress.slice(0, 8)}...{clawrencePkpAddress.slice(-6)}
          </code>
        </div>

        <div className="border-t pt-2">
          <div className="mb-1 text-gray-600">Permitted Lit Action</div>
          <code className="block rounded bg-blue-50 px-2 py-1 text-xs">
            IPFS: {safeExecutorCid}
          </code>
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

        <div className="border-t pt-2 text-xs text-gray-400">
          Clawrence can ONLY sign through the permitted Lit Action.
          <br />
          It cannot sign arbitrary transactions or bypass policy.
        </div>
      </div>
    </div>
  );
}

