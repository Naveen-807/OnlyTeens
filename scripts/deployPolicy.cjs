/* eslint-disable no-console */
const hre = require("hardhat");

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

  console.log(`Policy deployed: ${address}`);
  console.log(`Explorer: https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
