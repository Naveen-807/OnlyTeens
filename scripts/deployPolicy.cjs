/* eslint-disable no-console */
const fs = require("node:fs");
const hre = require("hardhat");

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function mergeContracts(existing, next) {
  return {
    generatedAt: new Date().toISOString(),
    contracts: {
      ...(existing?.contracts || {}),
      ...next,
    },
  };
}

function getAccessAddressForPolicy() {
  const fromEnv =
    process.env.POLICY_ACCESS_CONTRACT ||
    process.env.ACCESS_CONTRACT_SEPOLIA ||
    process.env.NEXT_PUBLIC_ACCESS_CONTRACT ||
    process.env.ACCESS_CONTRACT;
  if (!fromEnv || fromEnv === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      "Missing POLICY_ACCESS_CONTRACT/ACCESS_CONTRACT_SEPOLIA for Proof18Policy constructor",
    );
  }
  return fromEnv;
}

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY for policy deployment");
  }
  const accessAddress = getAccessAddressForPolicy();
  console.log(`Deploying Proof18Policy with access=${accessAddress} ...`);

  const Policy = await hre.ethers.getContractFactory("Proof18Policy");
  const policy = await Policy.deploy(accessAddress);
  await policy.waitForDeployment();
  const address = await policy.getAddress();
  const txHash = policy.deploymentTransaction()?.hash;

  console.log(`Policy deployed: ${address}`);
  console.log(`Explorer: https://sepolia.etherscan.io/address/${address}`);

  const deployments = mergeContracts(readJson("deployments.json"), {
    policy: {
      address,
      explorer: `https://sepolia.etherscan.io/address/${address}`,
      explorerUrl: `https://sepolia.etherscan.io/address/${address}`,
      deploymentTxHash: txHash,
      chainId: 11155111,
      network: "Ethereum Sepolia",
    },
  });
  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("deployments.json updated with policy.");

  const health = mergeContracts(readJson("deployment-health.json"), {
    policy: {
      name: "policy",
      chainId: 11155111,
      network: "Ethereum Sepolia",
      address,
      explorerUrl: `https://sepolia.etherscan.io/address/${address}`,
      deploymentTxHash: txHash,
      lastVerifiedAt: null,
    },
  });
  fs.writeFileSync("deployment-health.json", JSON.stringify(health, null, 2));
  console.log("deployment-health.json updated with policy.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
