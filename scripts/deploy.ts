import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Deploying Proof18 to Flow EVM Testnet...\n");

  const Access = await ethers.getContractFactory("Proof18Access");
  const access = await Access.deploy();
  await access.waitForDeployment();
  const accessAddr = await access.getAddress();
  console.log(`✅ Proof18Access: ${accessAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${accessAddr}\n`);

  const Vault = await ethers.getContractFactory("Proof18Vault");
  const vault = await Vault.deploy(accessAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`✅ Proof18Vault: ${vaultAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${vaultAddr}\n`);

  const Scheduler = await ethers.getContractFactory("Proof18Scheduler");
  const scheduler = await Scheduler.deploy(accessAddr, vaultAddr);
  await scheduler.waitForDeployment();
  const schedulerAddr = await scheduler.getAddress();
  console.log(`✅ Proof18Scheduler: ${schedulerAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${schedulerAddr}\n`);

  const Passport = await ethers.getContractFactory("Proof18Passport");
  const passport = await Passport.deploy(accessAddr);
  await passport.waitForDeployment();
  const passportAddr = await passport.getAddress();
  console.log(`✅ Proof18Passport: ${passportAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${passportAddr}\n`);

  const deployments = {
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

  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("📄 Deployment info saved to deployments.json");

  const readmeSection = `
## 🔗 Deployed Contracts (Flow EVM Testnet)

| Contract | Address | Explorer |
|---|---|---|
| Proof18Access | \`${accessAddr}\` | [View →](https://evm-testnet.flowscan.io/address/${accessAddr}) |
| Proof18Vault | \`${vaultAddr}\` | [View →](https://evm-testnet.flowscan.io/address/${vaultAddr}) |
| Proof18Scheduler | \`${schedulerAddr}\` | [View →](https://evm-testnet.flowscan.io/address/${schedulerAddr}) |
| Proof18Passport | \`${passportAddr}\` | [View →](https://evm-testnet.flowscan.io/address/${passportAddr}) |

**Chain ID:** 545 | **Network:** Flow EVM Testnet
`;
  fs.writeFileSync("DEPLOYMENT_LINKS.md", readmeSection);
  console.log("📄 README deployment section saved to DEPLOYMENT_LINKS.md");
}

main().catch(console.error);
