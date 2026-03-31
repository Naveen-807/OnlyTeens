import "server-only";

import { createInstance } from "fhevmjs";

import { isZeroAddress } from "@/lib/runtime/config";
import { assertLiveMode } from "@/lib/runtime/liveMode";

let instance: any = null;

export async function getFhevmInstance() {
  if (!instance) {
    const kmsContractAddress =
      process.env.ZAMA_KMS_CONTRACT_ADDRESS ||
      "0x0000000000000000000000000000000000000000";
    const aclContractAddress =
      process.env.ZAMA_ACL_CONTRACT_ADDRESS ||
      "0x0000000000000000000000000000000000000000";

    assertLiveMode(
      !isZeroAddress(kmsContractAddress),
      "POLICY_UNAVAILABLE:ZAMA_KMS_CONTRACT_ADDRESS must be configured in live mode",
    );
    assertLiveMode(
      !isZeroAddress(aclContractAddress),
      "POLICY_UNAVAILABLE:ZAMA_ACL_CONTRACT_ADDRESS must be configured in live mode",
    );

    instance = await createInstance({
      networkUrl: process.env.ZAMA_NETWORK_URL || "https://devnet.zama.ai",
      gatewayUrl:
        process.env.ZAMA_GATEWAY_URL || "https://gateway.sepolia.zama.ai",
      kmsContractAddress,
      aclContractAddress,
    });
  }
  return instance;
}
