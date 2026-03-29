import "server-only";

import * as CAR from "@ucanto/transport/car";
import { base64 } from "multiformats/bases/base64";
import * as Client from "@storacha/client";
import { Signer } from "@storacha/client/principal/ed25519";
import * as Proof from "@storacha/client/proof";
import { identity } from "multiformats/hashes/identity";
import * as Link from "multiformats/link";

const DELEGATION_ABILITIES = {
  guardian: ["space/blob/add", "upload/add"],
  teen: ["upload/list"],
  executor: ["space/blob/add", "upload/add"],
} as const;

function encodeDelegation(delegation: any): Promise<string> {
  return delegation.archive().then((bytesResult: Uint8Array) =>
    Link.create(CAR.codec.code, identity.digest(bytesResult)).toString(base64),
  );
}

async function getRootClient() {
  if (!process.env.STORACHA_KEY || !process.env.STORACHA_PROOF) {
    throw new Error("MISSING_CONFIG:Storacha credentials are not configured");
  }

  const principal = Signer.parse(process.env.STORACHA_KEY);
  const client = await Client.create({ principal });
  const proof = await Proof.parse(process.env.STORACHA_PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  return client;
}

export async function createFamilyDelegations() {
  const client = await getRootClient();
  const guardianAudience = await Signer.generate();
  const teenAudience = await Signer.generate();
  const executorAudience = await Signer.generate();

  const guardianDelegation = await client.createDelegation(
    guardianAudience,
    [...DELEGATION_ABILITIES.guardian],
  );
  const teenDelegation = await client.createDelegation(
    teenAudience,
    [...DELEGATION_ABILITIES.teen],
  );
  const executorDelegation = await client.createDelegation(
    executorAudience,
    [...DELEGATION_ABILITIES.executor],
  );

  return {
    guardian: await encodeDelegation(guardianDelegation),
    teen: await encodeDelegation(teenDelegation),
    executor: await encodeDelegation(executorDelegation),
  };
}

export function buildDelegationNote(params: {
  familyId: string;
  role: "guardian" | "teen" | "executor";
}) {
  return {
    type: "ucan_delegation_hint",
    familyId: params.familyId,
    role: params.role,
    abilities: DELEGATION_ABILITIES[params.role],
    timestamp: new Date().toISOString(),
  };
}
