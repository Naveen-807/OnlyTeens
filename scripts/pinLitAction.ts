import "dotenv/config";

import fs from "node:fs";

async function main() {
  const filePath = "litActions/safeExecutor.js";
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found`);
  }

  const source = fs.readFileSync(filePath, "utf8");
  console.log("📌 Lit Action ready to pin:");
  console.log("-", filePath);
  console.log("-", `${source.length} bytes`);
  console.log("");
  console.log(
    "This repo does not include an IPFS pinning provider integration yet.\n" +
      "Pin the file to IPFS (your preferred provider), then set NEXT_PUBLIC_SAFE_EXECUTOR_CID / SAFE_EXECUTOR_CID in .env.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

