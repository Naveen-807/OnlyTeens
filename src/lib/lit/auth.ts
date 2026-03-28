import "server-only";

import { privateKeyToAccount } from "viem/accounts";

import { getLitClient } from "@/lib/lit/client";
import type { Role } from "@/lib/types";

let mintingAccount: ReturnType<typeof privateKeyToAccount> | null = null;

function getMintingAccount() {
  const key = process.env.LIT_MINTING_KEY;
  if (!key) {
    throw new Error("Missing LIT_MINTING_KEY (required for PKP minting)");
  }
  if (!mintingAccount) {
    mintingAccount = privateKeyToAccount(key as `0x${string}`);
  }
  return mintingAccount;
}

export async function mintPKPWithGoogle(
  googleIdToken: string,
  role: Role,
): Promise<{
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}> {
  const client = await getLitClient();
  const scopes = role === "guardian" ? [1] : [2];

  const result: any = await (client as any).mintWithAuth({
    signer: getMintingAccount(),
    authMethod: {
      authMethodType: 6,
      accessToken: googleIdToken,
    },
    scopes,
  });

  return {
    tokenId: result.pkp.tokenId,
    publicKey: result.pkp.publicKey,
    ethAddress: result.pkp.ethAddress,
  };
}

export async function mintClawrencePKP(
  litActionIpfsCid: string,
): Promise<{
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}> {
  const client = await getLitClient();

  const result: any = await (client as any).mintWithCustomAuth({
    signer: getMintingAccount(),
    authMethod: {
      authMethodType: 15,
      authMethodId: litActionIpfsCid,
      accessToken: "",
    },
    litActionIpfsCid,
    scopes: [2],
    addPkpAsPermittedAddress: false,
    sendPkpToItself: true,
  });

  return {
    tokenId: result.pkp.tokenId,
    publicKey: result.pkp.publicKey,
    ethAddress: result.pkp.ethAddress,
  };
}

export async function getSessionSigs(pkpPublicKey: string, authMethod: any) {
  const client = await getLitClient();

  const sessionSigs = await (client as any).getSessionSigs({
    pkpPublicKey,
    authMethod,
    chain: "ethereum",
    resourceAbilityRequests: [
      {
        resource: { resource: "*", resourcePrefix: "lit-litaction" },
        ability: "lit-action-execution",
      },
      {
        resource: { resource: "*", resourcePrefix: "lit-pkp" },
        ability: "pkp-signing",
      },
    ],
  });

  return sessionSigs;
}
