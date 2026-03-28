import "server-only";

import { getLitClient } from "@/lib/lit/client";

export async function encryptForAddress(
  data: string,
  allowedAddress: string,
  sessionSigs: any,
): Promise<{ ciphertext: string; dataToEncryptHash: string }> {
  const client = await getLitClient();

  const { ciphertext, dataToEncryptHash } = await (client as any).encrypt({
    dataToEncrypt: new TextEncoder().encode(data),
    accessControlConditions: [
      {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: { comparator: "=", value: allowedAddress },
      },
    ],
    sessionSigs,
  });

  return { ciphertext, dataToEncryptHash };
}

export async function decryptData(
  ciphertext: string,
  dataToEncryptHash: string,
  allowedAddress: string,
  sessionSigs: any,
): Promise<string> {
  const client = await getLitClient();

  const { decryptedData } = await (client as any).decrypt({
    ciphertext,
    dataToEncryptHash,
    accessControlConditions: [
      {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: { comparator: "=", value: allowedAddress },
      },
    ],
    sessionSigs,
  });

  return new TextDecoder().decode(decryptedData);
}

