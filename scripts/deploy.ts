import { ethers } from "hardhat";
import * as fs from "fs";

function readJson(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function mergeContracts(existing: any, next: Record<string, unknown>) {
  return {
    generatedAt: new Date().toISOString(),
    contracts: {
      ...(existing?.contracts || {}),
      ...next,
    },
  };
}

async function main() {
  console.log("🚀 Deploying Proof18 to Flow EVM Testnet...\n");

  const Access = await ethers.getContractFactory("Proof18Access");
  const access = await Access.deploy();
  await access.waitForDeployment();
  const accessAddr = await access.getAddress();
  const accessTx = access.deploymentTransaction()?.hash;
  console.log(`✅ Proof18Access: ${accessAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${accessAddr}\n`);

  const Vault = await ethers.getContractFactory("Proof18Vault");
  const vault = await Vault.deploy(accessAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  const vaultTx = vault.deploymentTransaction()?.hash;
  console.log(`✅ Proof18Vault: ${vaultAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${vaultAddr}\n`);

  const Scheduler = await ethers.getContractFactory("Proof18Scheduler");
  const scheduler = await Scheduler.deploy(accessAddr, vaultAddr);
  await scheduler.waitForDeployment();
  const schedulerAddr = await scheduler.getAddress();
  const schedulerTx = scheduler.deploymentTransaction()?.hash;
  console.log(`✅ Proof18Scheduler: ${schedulerAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${schedulerAddr}\n`);

  const Passport = await ethers.getContractFactory("Proof18Passport");
  const passport = await Passport.deploy(accessAddr);
  await passport.waitForDeployment();
  const passportAddr = await passport.getAddress();
  const passportTx = passport.deploymentTransaction()?.hash;
  console.log(`✅ Proof18Passport: ${passportAddr}`);
  console.log(`   Explorer: https://evm-testnet.flowscan.io/address/${passportAddr}\n`);

  const deployments = mergeContracts(readJson("deployments.json"), {
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

  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("📄 Deployment info saved to deployments.json");

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
  console.log("📄 Deployment health saved to deployment-health.json");

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
