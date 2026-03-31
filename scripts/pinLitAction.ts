import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

import { uploadFileBlob } from "../src/lib/storacha/client";

async function main() {
  const filePath = "litActions/safeExecutor.js";
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found`);
  }

  const source = fs.readFileSync(filePath, "utf8");
  const blob = new Blob([source], { type: "application/javascript" });
  const pinned = await uploadFileBlob(blob);

  const cidFilePath = path.join("litActions", "safeExecutor.cid");
  fs.writeFileSync(cidFilePath, `${pinned.cid}\n`, "utf8");

  console.log("📌 Lit Action pinned to IPFS via Storacha");
  console.log("-", `source: ${filePath}`);
  console.log("-", `size: ${source.length} bytes`);
  console.log("-", `cid: ${pinned.cid}`);
  console.log("-", `url: ${pinned.url}`);
  console.log("-", `saved: ${cidFilePath}`);
  console.log("");
  console.log("Set the runtime env vars before demo:");
  console.log(`SAFE_EXECUTOR_CID=${pinned.cid}`);
  console.log(`NEXT_PUBLIC_SAFE_EXECUTOR_CID=${pinned.cid}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
