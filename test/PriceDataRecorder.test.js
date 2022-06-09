const { defaultAbiCoder } = require("@ethersproject/abi");
const axios = require("axios");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceDataRecorder", () => {
  let deployer;

  let priceDataRecorder;

  // --- Constants ---

  const BORED_APE_YACHT_CLUB = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
  const COOL_CATS = "0x1a92f7381b9f03921564a437210bb9396471050c";

  // --- Setup ---

  beforeEach(async () => {
    [deployer] = await ethers.getSigners();

    priceDataRecorder = await ethers
      .getContractFactory("PriceDataRecorder", deployer)
      .then((factory) => factory.deploy());
  });

  const getMessage = async (collection) => {
    const baseUrl = "https://api.reservoir.tools/oracle/collections";

    const name = "PriceDataRecorder";
    const version = "1";
    const contract = priceDataRecorder.address;

    return axios
      .get(
        `${baseUrl}/${collection}/floor-ask/v1?contractName=${name}&contractVersion=${version}&verifyingContract=${contract}&kind=twap`
      )
      .then((response) => response.data.message);
  };

  // --- Tests ---

  it("Record price when given valid oracle message", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);
    await priceDataRecorder
      .connect(deployer)
      .recordPrice(BORED_APE_YACHT_CLUB, message);

    const priceData = await priceDataRecorder.priceData(
      BORED_APE_YACHT_CLUB,
      0
    );

    expect(priceData.price).to.eq(
      defaultAbiCoder.decode(["uint256"], message.payload)[0]
    );
    expect(priceData.timestamp).to.eq(
      (await ethers.provider.getBlock("latest")).timestamp
    );
  });

  it("Cannot record expired price", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);
    await network.provider.send("evm_increaseTime", [6 * 60]);

    await expect(
      priceDataRecorder
        .connect(deployer)
        .recordPrice(BORED_APE_YACHT_CLUB, message)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });

  it("Cannot record price from invalid signature", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);
    message.signature = message.signature.slice(0, -2) + "00";

    await expect(
      priceDataRecorder
        .connect(deployer)
        .recordPrice(BORED_APE_YACHT_CLUB, message)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });

  it("Cannot record price from non-matching collection", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);
    message.signature = message.signature.slice(0, -2) + "00";

    await expect(
      priceDataRecorder.connect(deployer).recordPrice(COOL_CATS, message)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });
});
