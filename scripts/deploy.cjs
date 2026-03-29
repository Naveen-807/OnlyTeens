/* eslint-disable no-console */
const fs = require("node:fs");
const hre = require("hardhat");

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY for Flow deployment");
  }
  console.log("Deploying Proof18 Flow contracts to Flow EVM Testnet...");

  const Access = await hre.ethers.getContractFactory("Proof18Access");
  const access = await Access.deploy();
  await access.waitForDeployment();
  const accessAddr = await access.getAddress();
  console.log(`  access: ${accessAddr}`);

  const Vault = await hre.ethers.getContractFactory("Proof18Vault");
  const vault = await Vault.deploy(accessAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`  vault: ${vaultAddr}`);

  const Scheduler = await hre.ethers.getContractFactory("Proof18Scheduler");
  const scheduler = await Scheduler.deploy(accessAddr, vaultAddr);
  await scheduler.waitForDeployment();
  const schedulerAddr = await scheduler.getAddress();
  console.log(`  scheduler: ${schedulerAddr}`);

  const Passport = await hre.ethers.getContractFactory("Proof18Passport");
  const passport = await Passport.deploy(accessAddr);
  await passport.waitForDeployment();
  const passportAddr = await passport.getAddress();
  console.log(`  passport: ${passportAddr}`);

  const output = {
    network: "Flow EVM Testnet",
    chainId: 545,
    timestamp: new Date().toISOString(),
    contracts: {
      access: {
        address: accessAddr,
        explorer: `https://evm-testnet.flowscan.io/address/${accessAddr}`,
      },
      vault: {
        address: vaultAddr,
        explorer: `https://evm-testnet.flowscan.io/address/${vaultAddr}`,
      },
      scheduler: {
        address: schedulerAddr,
        explorer: `https://evm-testnet.flowscan.io/address/${schedulerAddr}`,
      },
      passport: {
        address: passportAddr,
        explorer: `https://evm-testnet.flowscan.io/address/${passportAddr}`,
      },
    },
  };

  fs.writeFileSync("deployments.json", JSON.stringify(output, null, 2));
  console.log("deployments.json updated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
