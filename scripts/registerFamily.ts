import "dotenv/config";

import { ethers } from "hardhat";
import fs from "node:fs";

function loadDeployments() {
  if (!fs.existsSync("deployments.json")) {
    throw new Error("deployments.json not found. Run `npm run hardhat:deploy:flow` first.");
  }
  return JSON.parse(fs.readFileSync("deployments.json", "utf8"));
}

async function main() {
  const deployments = loadDeployments();
  const accessAddress = deployments.contracts.access.address as string;

  const familyLabel = process.env.FAMILY_LABEL || "demo-family";
  const guardian = process.env.DEMO_GUARDIAN_ADDRESS;
  const teen = process.env.DEMO_TEEN_ADDRESS;
  const executor = process.env.DEMO_EXECUTOR_ADDRESS;

  if (!guardian || !teen || !executor) {
    throw new Error(
      "Set DEMO_GUARDIAN_ADDRESS, DEMO_TEEN_ADDRESS, DEMO_EXECUTOR_ADDRESS (and optionally FAMILY_LABEL).",
    );
  }

  const familyId = ethers.keccak256(ethers.toUtf8Bytes(familyLabel));

  const access = await ethers.getContractAt("Proof18Access", accessAddress);
  const tx = await access.registerFamily(familyId, guardian, teen, executor);
  await tx.wait();

  console.log("✅ Family registered");
  console.log("familyLabel:", familyLabel);
  console.log("familyId:", familyId);
  console.log("guardian:", guardian);
  console.log("teen:", teen);
  console.log("executor:", executor);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

