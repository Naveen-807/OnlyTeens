import { getLitClient } from "./litClient";

export async function setupClawrencePermissions(
  clawrencePkpTokenId: string,
  safeExecutorIpfsCid: string
) {
  const client = await getLitClient();
  const permissionsManager = await client.getPKPPermissionsManager({
    tokenId: clawrencePkpTokenId,
  });

  // Allow ONLY this specific Lit Action to sign with Clawrence's PKP
  await permissionsManager.addPermittedAction({
    ipfsCid: safeExecutorIpfsCid,
    scopes: [2], // PersonalSign only
  });

  return { success: true };
}

export async function revokeClawrencePermission(
  clawrencePkpTokenId: string,
  ipfsCidToRevoke: string
) {
  const client = await getLitClient();
  const permissionsManager = await client.getPKPPermissionsManager({
    tokenId: clawrencePkpTokenId,
  });

  await permissionsManager.removePermittedAction({
    ipfsCid: ipfsCidToRevoke,
  });

  return { revoked: true };
}

// ─── View current permissions (for judge-visible proof screen) ───
export async function viewPermissions(pkpTokenId: string) {
  const client = await getLitClient();
  const permissions = await client.viewPKPPermissions({
    tokenId: pkpTokenId,
  });
  return permissions;
}
