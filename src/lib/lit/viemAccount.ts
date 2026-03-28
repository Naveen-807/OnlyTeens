import "server-only";

import { getLitClient } from "@/lib/lit/client";

export async function getPkpAccount(pkpPublicKey: string, sessionSigs: any) {
  const client = await getLitClient();

  return await (client as any).getPkpViemAccount({
    pkpPublicKey,
    sessionSigs,
  });
}

