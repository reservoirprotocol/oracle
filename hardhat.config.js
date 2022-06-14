const { config } = require("dotenv");
config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

const accounts = process.env.DEPLOYER_PK
  ? [process.env.DEPLOYER_PK]
  : undefined;

module.exports = {
  solidity: "0.8.13",
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: Number(process.env.BLOCK_NUMBER),
      },
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
