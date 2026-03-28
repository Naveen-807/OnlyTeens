import { getStorachaClient } from "./storachaClient";

export interface ConversationLog {
  familyId: string;
  teenAddress: string;
  sessionId: string;
  messages: Array<{
    role: "teen" | "clawrence" | "system";
    content: string;
    timestamp: string;
    policyDecision?: string;
    actionTaken?: string;
  }>;
  startedAt: string;
  endedAt: string;
  actionsTriggered: number;
  flowTxHashes: string[];
  receiptCids: string[];
}

export async function storeConversationLog(
  log: ConversationLog
): Promise<{ cid: string; url: string }> {
  const client = await getStorachaClient();

  const blob = new Blob([JSON.stringify(log, null, 2)], {
    type: "application/json",
  });

  const cid = await client.uploadFile(blob);

  return {
    cid: cid.toString(),
    url: `https://storacha.link/ipfs/${cid.toString()}`,
  };
}
