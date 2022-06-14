const { defaultAbiCoder } = require("@ethersproject/abi");
const { Common } = require("@reservoir0x/sdk");
const axios = require("axios");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const { BASE_RESERVOIR_API_URL } = require("../constants");

describe("PriceDataRecorder", () => {
  let deployer;

  let priceDataRecorder;

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

    priceDataRecorder = await ethers
      .getContractFactory("PriceDataRecorder", deployer)
      .then((factory) => factory.deploy(Common.Addresses.Usdc[1]));
  });

  const getMessage = async (collection, currency) => {
    const baseUrl = `${BASE_RESERVOIR_API_URL}/oracle/collections`;

    return axios
      .get(
        `${baseUrl}/${collection}/floor-ask/v1?kind=twap&currency=${currency}`
      )
      .then((response) => response.data.message);
  };

  // --- Tests ---

  it("Record price when given valid oracle message", async () => {
    const message = await getMessage(
      BORED_APE_YACHT_CLUB,
      Common.Addresses.Usdc[1]
    );
    await priceDataRecorder
      .connect(deployer)
      .recordPrice(BORED_APE_YACHT_CLUB, message);

    const priceData = await priceDataRecorder.priceData(
      BORED_APE_YACHT_CLUB,
      0
    );

    expect(priceData.price).to.eq(
      defaultAbiCoder.decode(["address", "uint256"], message.payload)[1]
    );
    expect(priceData.timestamp).to.eq(
      (await ethers.provider.getBlock("latest")).timestamp
    );
  });

  it("Cannot record price from invalid signature", async () => {
    const message = await getMessage(
      BORED_APE_YACHT_CLUB,
      Common.Addresses.Usdc[1]
    );
    message.signature = message.signature.slice(0, -2) + "00";

    await expect(
      priceDataRecorder
        .connect(deployer)
        .recordPrice(BORED_APE_YACHT_CLUB, message)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });

  it("Cannot record price from non-matching collection", async () => {
    const message = await getMessage(
      BORED_APE_YACHT_CLUB,
      Common.Addresses.Usdc[1]
    );
    message.signature = message.signature.slice(0, -2) + "00";

    await expect(
      priceDataRecorder.connect(deployer).recordPrice(COOL_CATS, message)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });
});
