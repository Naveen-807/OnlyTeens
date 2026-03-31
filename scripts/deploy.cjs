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

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY for Flow deployment");
  }
  console.log("Deploying Proof18 Flow contracts to Flow EVM Testnet...");

  const Access = await hre.ethers.getContractFactory("Proof18Access");
  const access = await Access.deploy();
  await access.waitForDeployment();
  const accessAddr = await access.getAddress();
  const accessTx = access.deploymentTransaction()?.hash;
  console.log(`  access: ${accessAddr}`);

  const Vault = await hre.ethers.getContractFactory("Proof18Vault");
  const vault = await Vault.deploy(accessAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  const vaultTx = vault.deploymentTransaction()?.hash;
  console.log(`  vault: ${vaultAddr}`);

  const Scheduler = await hre.ethers.getContractFactory("Proof18Scheduler");
  const scheduler = await Scheduler.deploy(accessAddr, vaultAddr);
  await scheduler.waitForDeployment();
  const schedulerAddr = await scheduler.getAddress();
  const schedulerTx = scheduler.deploymentTransaction()?.hash;
  console.log(`  scheduler: ${schedulerAddr}`);

  const Passport = await hre.ethers.getContractFactory("Proof18Passport");
  const passport = await Passport.deploy(accessAddr);
  await passport.waitForDeployment();
  const passportAddr = await passport.getAddress();
  const passportTx = passport.deploymentTransaction()?.hash;
  console.log(`  passport: ${passportAddr}`);

  const output = mergeContracts(readJson("deployments.json"), {
    access: {
      address: accessAddr,
      explorer: `https://evm-testnet.flowscan.io/address/${accessAddr}`,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${accessAddr}`,
      deploymentTxHash: accessTx,
      chainId: 545,
      network: "Flow EVM Testnet",
    },
    vault: {
      address: vaultAddr,
      explorer: `https://evm-testnet.flowscan.io/address/${vaultAddr}`,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${vaultAddr}`,
      deploymentTxHash: vaultTx,
      chainId: 545,
      network: "Flow EVM Testnet",
    },
    scheduler: {
      address: schedulerAddr,
      explorer: `https://evm-testnet.flowscan.io/address/${schedulerAddr}`,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${schedulerAddr}`,
      deploymentTxHash: schedulerTx,
      chainId: 545,
      network: "Flow EVM Testnet",
    },
    passport: {
      address: passportAddr,
      explorer: `https://evm-testnet.flowscan.io/address/${passportAddr}`,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${passportAddr}`,
      deploymentTxHash: passportTx,
      chainId: 545,
      network: "Flow EVM Testnet",
    },
  });

  fs.writeFileSync("deployments.json", JSON.stringify(output, null, 2));
  console.log("deployments.json updated.");

  const health = mergeContracts(readJson("deployment-health.json"), {
    access: {
      name: "access",
      chainId: 545,
      network: "Flow EVM Testnet",
      address: accessAddr,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${accessAddr}`,
      deploymentTxHash: accessTx,
      lastVerifiedAt: null,
    },
    vault: {
      name: "vault",
      chainId: 545,
      network: "Flow EVM Testnet",
      address: vaultAddr,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${vaultAddr}`,
      deploymentTxHash: vaultTx,
      lastVerifiedAt: null,
    },
    scheduler: {
      name: "scheduler",
      chainId: 545,
      network: "Flow EVM Testnet",
      address: schedulerAddr,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${schedulerAddr}`,
      deploymentTxHash: schedulerTx,
      lastVerifiedAt: null,
    },
    passport: {
      name: "passport",
      chainId: 545,
      network: "Flow EVM Testnet",
      address: passportAddr,
      explorerUrl: `https://evm-testnet.flowscan.io/address/${passportAddr}`,
      deploymentTxHash: passportTx,
      lastVerifiedAt: null,
    },
  });
  fs.writeFileSync("deployment-health.json", JSON.stringify(health, null, 2));
  console.log("deployment-health.json updated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
