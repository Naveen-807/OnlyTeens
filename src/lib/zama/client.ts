import "server-only";

import { createInstance } from "fhevmjs";

let instance: any = null;

export async function getFhevmInstance() {
  if (!instance) {
    instance = await createInstance({
      networkUrl: process.env.ZAMA_NETWORK_URL || "https://devnet.zama.ai",
      gatewayUrl:
        process.env.ZAMA_GATEWAY_URL || "https://gateway.sepolia.zama.ai",
      // fhevmjs requires these contract addresses for onchain key management + ACL.
      // For hackathon/MVP we allow env-config (recommended) and fall back to 0x0.
      kmsContractAddress:
        process.env.ZAMA_KMS_CONTRACT_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      aclContractAddress:
        process.env.ZAMA_ACL_CONTRACT_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    });
  }
  return instance;
}
