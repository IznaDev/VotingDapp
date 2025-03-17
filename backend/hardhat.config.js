require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");
require("@nomicfoundation/hardhat-verify");
require("solidity-docgen");
require("dotenv").config();
require("hardhat-gas-reporter");

const { SEPOLIA_API_URL, PRIVATE_KEY, SEPOLIA_PRIVATE_KEY, API_URL } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'EUR',
  },
  networks: {
    hardhatLocal: {
      accounts: [PRIVATE_KEY],
      url: API_URL,
    },
    sepolia: {
      accounts: [SEPOLIA_PRIVATE_KEY],
      url: SEPOLIA_API_URL,
    },
  },
};
