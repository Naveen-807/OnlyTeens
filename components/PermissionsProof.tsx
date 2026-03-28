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
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">🔐 Permission Proof</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Guardian PKP</span>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {guardianPkpAddress.slice(0, 8)}...{guardianPkpAddress.slice(-6)}
          </code>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Teen PKP</span>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {teenPkpAddress.slice(0, 8)}...{teenPkpAddress.slice(-6)}
          </code>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Clawrence PKP</span>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {clawrencePkpAddress.slice(0, 8)}...{clawrencePkpAddress.slice(-6)}
          </code>
        </div>

        <div className="border-t pt-2">
          <div className="text-gray-600 mb-1">Permitted Lit Action</div>
          <code className="text-xs bg-blue-50 px-2 py-1 rounded block">
            IPFS: {safeExecutorCid}
          </code>
        </div>

        <div>
          <div className="text-gray-600 mb-1">Allowed Scopes</div>
          {permittedScopes.map((scope) => (
            <span
              key={scope}
              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1"
            >
              {scope}
            </span>
          ))}
        </div>

        <div className="text-xs text-gray-400 border-t pt-2">
          Clawrence can ONLY sign through the permitted Lit Action.
          <br />
          It cannot sign arbitrary transactions or bypass policy.
        </div>
      </div>
    </div>
  );
}
