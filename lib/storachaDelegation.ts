import { getStorachaClient } from "./storachaClient";

// ─── Delegate upload permission to Clawrence (write-only) ───
export async function delegateToClawrence(clawrenceDid: string) {
  const client = await getStorachaClient();

  // Create a delegation that allows Clawrence to upload (write)
  // but scoped to only upload capabilities
  const delegation = await client.createDelegation(clawrenceDid, [
    "space/blob/add",
    "space/index/add",
    "upload/add",
  ]);

  return delegation;
}

// ─── Delegate read access to teen ───
export async function delegateReadToTeen(teenDid: string) {
  const client = await getStorachaClient();

  const delegation = await client.createDelegation(teenDid, [
    "upload/list",
    "upload/get/0.1",
  ]);

  return delegation;
}
