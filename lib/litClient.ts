import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

let litClient: Awaited<ReturnType<typeof createLitClient>> | null = null;

export async function getLitClient() {
  if (!litClient) {
    litClient = await createLitClient({
      network: nagaDev,
    });
  }
  return litClient;
}
