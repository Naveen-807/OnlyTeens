import { getLitClient } from "./litClient";
import { privateKeyToAccount } from "viem/accounts";
import { normalizePrivateKeyEnv } from "@/lib/runtime/privateKey";

function getMintingAccount() {
  return privateKeyToAccount(
    normalizePrivateKeyEnv("LIT_MINTING_KEY", process.env.LIT_MINTING_KEY)
  );
}

// ─── Mint Guardian PKP ───
export async function mintGuardianPKP(guardianAuthPayload: any) {
  const client = await getLitClient();
  const result = await client.mintWithAuth({
    signer: getMintingAccount(),
    authMethod: guardianAuthPayload,
    scopes: [1], // SignAnything — full guardian control
  });
  return {
    tokenId: result.pkp.tokenId,
    publicKey: result.pkp.publicKey,
    ethAddress: result.pkp.ethAddress,
  };
}

// ─── Mint Teen PKP (restricted scope) ───
export async function mintTeenPKP(teenAuthPayload: any) {
  const client = await getLitClient();
  const result = await client.mintWithAuth({
    signer: getMintingAccount(),
    authMethod: teenAuthPayload,
    scopes: [2], // PersonalSign only — restricted
  });
  return {
    tokenId: result.pkp.tokenId,
    publicKey: result.pkp.publicKey,
    ethAddress: result.pkp.ethAddress,
  };
}

// ─── Mint Clawrence PKP (AI agent - Lit Action only) ───
export async function mintClawrencePKP(litActionIpfsCid: string) {
  const client = await getLitClient();
  const result = await client.mintWithCustomAuth({
    signer: getMintingAccount(),
    authMethod: {
      authMethodType: 15, // Lit Action auth method
      authMethodId: litActionIpfsCid,
      accessToken: "",
    },
    litActionIpfsCid: litActionIpfsCid,
    scopes: [2], // PersonalSign only — bounded
    addPkpAsPermittedAddress: false,
    sendPkpToItself: true,
  });
  return result;
}
