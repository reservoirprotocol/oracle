const { Common } = require("@reservoir0x/sdk");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const main = async (collection) => {
  const chainId = await ethers.provider.getNetwork().then((n) => n.chainId);
  const [deployer] = await ethers.getSigners();

  const args = [collection, Common.Addresses.Usdc[chainId], "CHIMP / USDC"];

  const dataFeedOracleAdaptor = await ethers
    .getContractFactory("DataFeedOracleAdaptor", deployer)
    .then((factory) => factory.deploy(...args));
  console.log(
    `"DataFeedOracleAdaptor" deployed at address ${dataFeedOracleAdaptor.address}`
  );

  await hre.run("verify:verify", {
    address: dataFeedOracleAdaptor.address,
    constructorArguments: args,
  });
  console.log(`"DataFeedOracleAdaptor" successfully verified on Etherscan`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
