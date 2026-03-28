import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    flowTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      chainId: 545,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      flowTestnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "flowTestnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.io/api",
          browserURL: "https://evm-testnet.flowscan.io",
        },
      },
    ],
  },
};

export default config;
