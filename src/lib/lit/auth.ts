import "server-only";

import { randomBytes } from "node:crypto";

import { privateKeyToAccount } from "viem/accounts";

import {
  generateAuthSigWithViem,
  createSiweMessage,
} from "@lit-protocol/auth-helpers";

import { getLitClient } from "@/lib/lit/client";
import { normalizePrivateKeyEnv } from "@/lib/runtime/privateKey";
import type { AuthChannel, Role, UserSession } from "@/lib/types";

let mintingAccount: ReturnType<typeof privateKeyToAccount> | null = null;

function getMintingAccount() {
  const key = normalizePrivateKeyEnv("LIT_MINTING_KEY", process.env.LIT_MINTING_KEY);
  if (!mintingAccount) {
    mintingAccount = privateKeyToAccount(key);
  }
  return mintingAccount;
}

export async function buildPhoneAuthContext(session: UserSession) {
  const account = getMintingAccount();
  const sessionKeyPair = {
    publicKey: `0x${randomBytes(32).toString("hex")}`,
    secretKey: `0x${randomBytes(32).toString("hex")}`,
  };
  const phoneNumber = session.phoneNumber || "";
  const role = session.role;
  const authMethodId =
    session.authMethod?.authMethodId ||
    `${role}:${phoneNumber || session.address.toLowerCase()}`;

  const authData = {
    authMethodType: 11,
    authMethodId,
    accessToken: phoneNumber || session.address,
    metadata: {
      provider: session.authProvider || "twilio-verify",
      phoneNumber,
      role,
      verificationSid: session.verificationSid || "",
      familyId: session.familyId || "",
    },
  };

  const authContext = {
    account,
    authenticator: account,
    authData,
    sessionKeyPair,
    authConfig: {
      resources: [
        ["pkp-signing", "*"],
        ["lit-action-execution", "*"],
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      statement: `Proof18 ${role} phone session`,
      domain: "localhost",
    },
    authNeededCallback: async () => {
      const toSign = await createSiweMessage({
        walletAddress: account.address,
        statement: `Proof18 ${role} phone session`,
        uri: "https://proof18.local/login",
        domain: "proof18.local",
        nonce: `${session.phoneNumber || session.address}-${Date.now()}`,
      });
      return generateAuthSigWithViem({
        account,
        address: account.address,
        toSign,
      });
    },
  };

  return {
    authContext,
    authData,
  };
}

export async function mintPKPWithCustomAuth(
  authMethod: {
    authMethodType: number;
    authMethodId?: string;
    accessToken: string;
  },
  role: Role,
): Promise<{
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}> {
  const client = await getLitClient();
  const scopes = role === "guardian" ? [1] : [2];

  const result: any = await (client as any).mintWithCustomAuth({
    signer: getMintingAccount(),
    authMethod,
    scopes,
    addPkpAsPermittedAddress: false,
    sendPkpToItself: true,
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

export async function mintPKPWithPhoneDemo(
  phoneNumber: string,
  role: Role,
  verificationToken: string,
): Promise<{
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  authChannel: AuthChannel;
}> {
  const authMethod = {
    authMethodType: 89,
    authMethodId: phoneNumber,
    accessToken: verificationToken,
  };

  const pkp = await mintPKPWithCustomAuth(authMethod, role);
  return {
    ...pkp,
    authChannel: "phone",
  };
}

export function getClawrenceAuthMethod(litActionIpfsCid: string) {
  return {
    authMethodType: 15,
    authMethodId: litActionIpfsCid,
    accessToken: "",
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
