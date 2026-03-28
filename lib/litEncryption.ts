import { getLitClient } from "./litClient";

// ─── Encrypt guardian policy explanation ───
export async function encryptGuardianNote(
  note: string,
  guardianPkpPublicKey: string,
  sessionSigs: any
) {
  const client = await getLitClient();

  const { ciphertext, dataToEncryptHash } = await client.encrypt({
    dataToEncrypt: new TextEncoder().encode(note),
    accessControlConditions: [
      {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: {
          comparator: "=",
          value: guardianPkpPublicKey, // Only guardian can decrypt
        },
      },
    ],
    sessionSigs,
  });

  return { ciphertext, dataToEncryptHash };
}

// ─── Decrypt (guardian only) ───
export async function decryptGuardianNote(
  ciphertext: string,
  dataToEncryptHash: string,
  guardianSessionSigs: any
) {
  const client = await getLitClient();

  const decrypted = await client.decrypt({
    ciphertext,
    dataToEncryptHash,
    accessControlConditions: [
      {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: {
          comparator: "=",
          value: "GUARDIAN_ADDRESS",
        },
      },
    ],
    sessionSigs: guardianSessionSigs,
  });

  return new TextDecoder().decode(decrypted.decryptedData);
}
