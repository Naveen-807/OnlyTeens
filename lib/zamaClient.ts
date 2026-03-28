import { createInstance } from "fhevmjs";

let fhevmInstance: any = null;

const POLICY_ABI = [
  {
    type: "function",
    name: "setPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "familyId", type: "bytes32" },
      { name: "encSingleCap", type: "bytes32" },
      { name: "encRecurringCap", type: "bytes32" },
      { name: "encTrustThreshold", type: "bytes32" },
      { name: "encRiskFlags", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "evaluateAction",
    stateMutability: "nonpayable",
    inputs: [
      { name: "familyId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "currentPassportLevel", type: "uint8" },
      { name: "isRecurring", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "getGuardianPolicyView",
    stateMutability: "view",
    inputs: [{ name: "familyId", type: "bytes32" }],
    outputs: [
      { name: "singleCap", type: "bytes32" },
      { name: "recurringCap", type: "bytes32" },
      { name: "trustThreshold", type: "bytes32" },
    ],
  },
] as const;

export async function getFhevmInstance() {
  if (!fhevmInstance) {
    fhevmInstance = await createInstance({
      networkUrl: process.env.ZAMA_NETWORK_URL!,
      gatewayUrl: process.env.ZAMA_GATEWAY_URL!,
    });
  }
  return fhevmInstance;
}

// ─── Guardian sets encrypted policy ───
export async function submitEncryptedPolicy(params: {
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
  riskFlags: number;
  familyId: string;
  contractAddress: string;
  guardianSigner: any;
}) {
  const fhevm = await getFhevmInstance();

  // Create encrypted inputs with ZK proofs
  const input = fhevm.createEncryptedInput(
    params.contractAddress,
    params.guardianSigner.address
  );

  input.add64(params.singleActionCap);      // euint64
  input.add64(params.recurringMonthlyCap);   // euint64
  input.add8(params.trustUnlockThreshold);   // euint8
  input.add8(params.riskFlags);              // euint8

  const encryptedInputs = input.encrypt();

  // Call contract with encrypted values + proof
  const tx = await params.guardianSigner.writeContract({
    address: params.contractAddress,
    abi: POLICY_ABI,
    functionName: "setPolicy",
    args: [
      params.familyId,
      encryptedInputs.handles[0], // encSingleCap
      encryptedInputs.handles[1], // encRecurringCap
      encryptedInputs.handles[2], // encTrustThreshold
      encryptedInputs.handles[3], // encRiskFlags
      encryptedInputs.inputProof,
    ],
  });

  return tx;
}

// ─── Evaluate action (teen calls) ───
export async function evaluateAction(params: {
  familyId: string;
  amount: number;
  passportLevel: number;
  isRecurring: boolean;
  contractAddress: string;
  teenSigner: any;
}) {
  const tx = await params.teenSigner.writeContract({
    address: params.contractAddress,
    abi: POLICY_ABI,
    functionName: "evaluateAction",
    args: [
      params.familyId,
      params.amount,
      params.passportLevel,
      params.isRecurring,
    ],
  });

  return tx;
}

// ─── Guardian decrypts detailed reason ───
export async function guardianDecrypt(params: {
  contractAddress: string;
  familyId: string;
  guardianSigner: any;
}) {
  const fhevm = await getFhevmInstance();

  // Read encrypted handle from contract
  const [singleCap, recurringCap, trustThreshold] =
    await params.guardianSigner.readContract({
      address: params.contractAddress,
      abi: POLICY_ABI,
      functionName: "getGuardianPolicyView",
      args: [params.familyId],
    });

  // Request decryption through Zama gateway (guardian has ACL permission)
  const decryptedSingleCap = await fhevm.reencrypt(
    singleCap,
    params.guardianSigner
  );
  const decryptedRecurringCap = await fhevm.reencrypt(
    recurringCap,
    params.guardianSigner
  );

  return {
    singleActionCap: decryptedSingleCap,
    recurringMonthlyCap: decryptedRecurringCap,
  };
}
