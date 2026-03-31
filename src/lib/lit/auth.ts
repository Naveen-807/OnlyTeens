import "server-only";

import { createHash } from "node:crypto";

import type { AuthChannel, Role, UserSession } from "@/lib/types";

function digest(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function makeAddress(seed: string): `0x${string}` {
  return `0x${digest(seed).slice(0, 40)}` as `0x${string}`;
}

function makePublicKey(seed: string): `0x${string}` {
  return `0x${digest(`${seed}:pk`)}${digest(`${seed}:pk:2`)}` as `0x${string}`;
}

function makeTokenId(seed: string): string {
  return `0x${digest(`${seed}:token`)}`;
}

export function getLitMintingAccount() {
  return {
    address: process.env.CHIPOTLE_OWNER_ADDRESS || makeAddress("proof18-chipotle-owner"),
  };
}

export function mapLitMintingError(error: unknown, _walletAddress: string): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function buildPhoneAuthContext(session: UserSession) {
  const phoneNumber = session.phoneNumber || "";
  return {
    authContext: {
      provider: "chipotle-phone-session",
      role: session.role,
      phoneNumber,
      familyId: session.familyId,
      verificationId: session.verificationId || "",
    },
    authData: {
      authMethodType: 11,
      authMethodId: `${session.role}:${phoneNumber || session.address.toLowerCase()}`,
      accessToken: phoneNumber || session.address,
      metadata: {
        provider: session.authProvider || "twilio-verify",
        phoneNumber,
        role: session.role,
        familyId: session.familyId || "",
      },
    },
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
  const seed = `${role}:${authMethod.authMethodType}:${authMethod.authMethodId || authMethod.accessToken}`;
  return {
    tokenId: makeTokenId(seed),
    publicKey: makePublicKey(seed),
    ethAddress: makeAddress(seed),
  };
}

export async function mintClawrencePKP(
  litActionIpfsCid: string,
): Promise<{
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}> {
  const seed = `executor:${litActionIpfsCid}`;
  return {
    tokenId: makeTokenId(seed),
    publicKey: makePublicKey(seed),
    ethAddress: makeAddress(seed),
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
  const pkp = await mintPKPWithCustomAuth(
    {
      authMethodType: 89,
      authMethodId: phoneNumber,
      accessToken: verificationToken,
    },
    role,
  );

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

export async function getSessionSigs(_pkpPublicKey: string, _authMethod: any) {
  return null;
}
