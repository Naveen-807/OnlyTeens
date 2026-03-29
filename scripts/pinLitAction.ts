import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

import { create } from "@storacha/client";
import * as Proof from "@storacha/client/proof";
import * as Signer from "@storacha/client/principal/ed25519";
import { CarReader } from "@ucanto/transport/car";
import * as base64 from "multiformats/bases/base64";

async function getStorachaClient() {
  const key = process.env.STORACHA_KEY;
  const proof = process.env.STORACHA_PROOF;

  if (!key || !proof) {
    throw new Error("STORACHA_KEY and STORACHA_PROOF are required to pin the Lit Action");
  }

  const signer = await Signer.parse(key);
  const client = await create({ principal: signer });
  const proofBytes = base64.base64pad.decode(proof.trim());
  const delegation = await Proof.parse(await CarReader.fromBytes(proofBytes));
  await client.addSpace(delegation);
  await client.setCurrentSpace(delegation.did());

  return client;
}

async function main() {
  const filePath = path.resolve(process.cwd(), "litActions/safeExecutor.js");
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found`);
  }

  const source = fs.readFileSync(filePath);
  const client = await getStorachaClient();
  const file = new File([source], "safeExecutor.js", {
    type: "application/javascript",
  });

  const cid = await client.uploadFile(file);
  const cidString = cid.toString();

  console.log("📌 Lit Action pinned to Storacha/IPFS");
  console.log(`CID: ${cidString}`);
  console.log(`Gateway: https://ipfs.io/ipfs/${cidString}`);
  console.log("Set NEXT_PUBLIC_SAFE_EXECUTOR_CID and SAFE_EXECUTOR_CID to this value.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
