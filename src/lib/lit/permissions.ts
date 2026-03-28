import "server-only";

import { SAFE_EXECUTOR_CID } from "@/lib/constants";
import { getLitClient } from "@/lib/lit/client";

export async function grantExecutorPermission(
  clawrencePkpTokenId: string,
): Promise<void> {
  const client = await getLitClient();
  const pm = await (client as any).getPKPPermissionsManager({
    tokenId: clawrencePkpTokenId,
  });

  await pm.addPermittedAction({
    ipfsCid: SAFE_EXECUTOR_CID,
    scopes: [2],
  });
}

export async function revokeExecutorPermission(
  clawrencePkpTokenId: string,
  cidToRevoke: string,
): Promise<void> {
  const client = await getLitClient();
  const pm = await (client as any).getPKPPermissionsManager({
    tokenId: clawrencePkpTokenId,
  });

  await pm.removePermittedAction({ ipfsCid: cidToRevoke });
}

export async function getPermissions(pkpTokenId: string): Promise<any> {
  const client = await getLitClient();
  return await (client as any).viewPKPPermissions({ tokenId: pkpTokenId });
}

