import "server-only";

import * as Client from "@storacha/client";
import { Signer } from "@storacha/client/principal/ed25519";
import * as Proof from "@storacha/client/proof";
import { assertEnvForDemo } from "@/lib/runtime/config";

let client: Awaited<ReturnType<typeof Client.create>> | null = null;

export async function getStorachaClient() {
  assertEnvForDemo(["STORACHA_KEY", "STORACHA_PROOF"]);
  if (client) return client;

  if (!process.env.STORACHA_KEY || !process.env.STORACHA_PROOF) {
    throw new Error("MISSING_CONFIG:Storacha credentials are not configured");
  }

  const principal = Signer.parse(process.env.STORACHA_KEY);
  client = await Client.create({ principal });

  const proof = await Proof.parse(process.env.STORACHA_PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  return client;
}

export async function uploadJSON(
  data: Record<string, any>,
): Promise<{ cid: string; url: string }> {
  try {
    const c = await getStorachaClient();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const cid = await c.uploadFile(blob);
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
