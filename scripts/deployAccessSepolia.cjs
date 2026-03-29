/* eslint-disable no-console */
const hre = require("hardhat");

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY for Sepolia access deployment");
  }

  console.log("Deploying Proof18Access to Sepolia ...");
  const Access = await hre.ethers.getContractFactory("Proof18Access");
  const access = await Access.deploy();
  await access.waitForDeployment();
  const address = await access.getAddress();

  console.log(`POLICY_ACCESS_CONTRACT=${address}`);
  console.log(`Explorer: https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
