import "server-only";

import * as Client from "@storacha/client";
import { Signer } from "@storacha/client/principal/ed25519";
import * as Proof from "@storacha/client/proof";

import { getFamilyById } from "@/lib/onboarding/familyService";
import { assertEnvForDemo } from "@/lib/runtime/config";

export type StorachaRole = "guardian" | "teen" | "executor";

let rootClient: Awaited<ReturnType<typeof Client.create>> | null = null;
const delegatedClients = new Map<string, Awaited<ReturnType<typeof Client.create>>>();

async function buildRootClient() {
  assertEnvForDemo(["STORACHA_KEY", "STORACHA_PROOF"]);
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

export async function getStorachaClient() {
  if (!rootClient) {
    rootClient = await buildRootClient();
  }
  return rootClient;
}

export async function getDelegatedStorachaClient(options: {
  familyId: string;
  role: StorachaRole;
}) {
  const key = `${options.familyId}:${options.role}`;
  const cached = delegatedClients.get(key);
  if (cached) return cached;

  const family = getFamilyById(options.familyId);
  const proofString = family?.storachaDelegations?.[options.role];
  if (!proofString) {
    return getStorachaClient();
  }

  const client = await Client.create({ principal: await Signer.generate() });
  const proof = await Proof.parse(proofString);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  delegatedClients.set(key, client);
  return client;
}

export async function uploadJSON(
  data: Record<string, any>,
  options?: { familyId?: string; role?: StorachaRole },
): Promise<{ cid: string; url: string }> {
  try {
    const client = options?.familyId && options?.role
      ? await getDelegatedStorachaClient({ familyId: options.familyId, role: options.role })
      : await getStorachaClient();

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const cid = await client.uploadFile(blob);
    return {
      cid: cid.toString(),
      url: `https://storacha.link/ipfs/${cid.toString()}`,
    };
  } catch (error: any) {
    throw new Error(
      `EVIDENCE_WRITE_FAILED:${error?.message || "Storacha upload failed"}`,
    );
  }
}
