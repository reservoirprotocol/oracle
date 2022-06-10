const { defaultAbiCoder } = require("@ethersproject/abi");
const axios = require("axios");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Should be tested against a mainnet fork
describe("ChainlinkOracleAdaptor", () => {
  let deployer;

  let chainlinkOracleAdaptor;

  // --- Constants ---

  const BORED_APE_YACHT_CLUB = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
  const COOL_CATS = "0x1a92f7381b9f03921564a437210bb9396471050c";

  // --- Setup ---

  before(async () => {
    try {
      await network.provider.send("evm_setNextBlockTimestamp", [
        Math.floor(Date.now() / 1000) + 10,
      ]);
      await network.provider.send("evm_mine");
    } catch {}
  });

  beforeEach(async () => {
    [deployer] = await ethers.getSigners();

    chainlinkOracleAdaptor = await ethers
      .getContractFactory("ChainlinkOracleAdaptor", deployer)
      .then((factory) => factory.deploy(BORED_APE_YACHT_CLUB));
  });

  const getMessage = async (collection) => {
    const baseUrl = "https://api.reservoir.tools/oracle/collections";

    const name = "ChainlinkOracleAdaptor";
    const version = "1";
    const contract = chainlinkOracleAdaptor.address;

    return axios
      .get(
        `${baseUrl}/${collection}/floor-ask/v1?contractName=${name}&contractVersion=${version}&verifyingContract=${contract}&kind=twap`
      )
      .then((response) => response.data.message);
  };

  // --- Tests ---

  it("Record price when given valid oracle message", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);
    await chainlinkOracleAdaptor.connect(deployer).recordPrice(message);

    const result = await chainlinkOracleAdaptor.getRoundData(0);

    expect(result.answer).to.eq(
      defaultAbiCoder.decode(["uint256"], message.payload)[0]
    );
    expect(result.startedAt).to.eq(
      (await ethers.provider.getBlock("latest")).timestamp
    );
  });

  it("Cannot record price from invalid signature", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);
    message.signature = message.signature.slice(0, -2) + "00";

    await expect(
      chainlinkOracleAdaptor.connect(deployer).recordPrice(message)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });

  it("Cannot record price from non-matching collection", async () => {
    const message = await getMessage(COOL_CATS);

    await expect(
      chainlinkOracleAdaptor.connect(deployer).recordPrice(message)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });
});
