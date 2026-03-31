import "server-only";

import { getChipotleBaseUrl, isChipotleConfigured } from "@/lib/lit/chipotle";

export function getLitClient() {
  return {
    network: "chipotle",
    baseUrl: getChipotleBaseUrl(),
    configured: isChipotleConfigured(),
  };
}

export { getChipotleBaseUrl, isChipotleConfigured };
