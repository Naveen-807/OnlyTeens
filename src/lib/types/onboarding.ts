export interface OnboardingState {
  step: "guardian-auth" | "set-policy" | "invite-teen" | "teen-auth" | "complete";
  guardianAddress?: string;
  guardianPkpPublicKey?: string;
  guardianPkpTokenId?: string;
  teenAddress?: string;
  teenPkpPublicKey?: string;
  teenPkpTokenId?: string;
  clawrenceAddress?: string;
  clawrencePkpPublicKey?: string;
  clawrencePkpTokenId?: string;
  familyId?: string;
  policySet?: boolean;
  passportCreated?: boolean;
  error?: string;
}

export interface FamilyRecord {
  familyId: string;
  guardianAddress: string;
  guardianPkpPublicKey: string;
  guardianPkpTokenId: string;
  teenAddress: string;
  teenPkpPublicKey: string;
  teenPkpTokenId: string;
  clawrenceAddress: string;
  clawrencePkpPublicKey: string;
  clawrencePkpTokenId: string;
  litActionCid: string;
  accessContract: string;
  vaultContract: string;
  schedulerContract: string;
  passportContract: string;
  policyContract: string;
  createdAt: string;
  active: boolean;
}
