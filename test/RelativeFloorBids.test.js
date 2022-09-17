const { Common } = require("@reservoir0x/sdk");
const axios = require("axios");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const { BASE_RESERVOIR_API_URL } = require("../constants");

describe("RelativeFloorBids", () => {
  let deployer;
  let maker;
  let taker;

  let relativeFloorBids;

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
    [deployer, maker, taker] = await ethers.getSigners();

    relativeFloorBids = await ethers
      .getContractFactory("RelativeFloorBids", deployer)
      .then((factory) => factory.deploy());
  });

  const getMessage = async (collection, currency) => {
    const baseUrl = `${BASE_RESERVOIR_API_URL}/oracle/collections`;

    return axios
      .get(
        `${baseUrl}/${collection}/floor-ask/v2?kind=twap&currency=${currency}`
      )
      .then((response) => response.data.message);
  };

  // --- Tests ---

  it("Fill bid", async () => {
    const message = await getMessage(
      BORED_APE_YACHT_CLUB,
      Common.Addresses.Weth[1]
    );

    // Create bid at 80% of the floor price
    await relativeFloorBids
      .connect(maker)
      .createBid(
        message.id,
        8000,
        BORED_APE_YACHT_CLUB,
        Common.Addresses.Weth[1]
      );

    await relativeFloorBids.connect(taker).fillBid(0, message, 0);
  });

  it("Cannot fill bid when given an invalid signature", async () => {
    const message = await getMessage(
      BORED_APE_YACHT_CLUB,
      Common.Addresses.Weth[1]
    );

    // Create bid at 80% of the floor price
    await relativeFloorBids
      .connect(maker)
      .createBid(
        message.id,
        8000,
        BORED_APE_YACHT_CLUB,
        Common.Addresses.Weth[1]
      );

    message.signature = message.signature.slice(0, -2) + "00";

    await expect(
      relativeFloorBids.connect(taker).fillBid(0, message, 0)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });

  it("Cannot record price from non-matching collection", async () => {
    let message = await getMessage(
      BORED_APE_YACHT_CLUB,
      Common.Addresses.Weth[1]
    );

    // Create bid at 80% of the floor price
    await relativeFloorBids
      .connect(maker)
      .createBid(
        message.id,
        8000,
        BORED_APE_YACHT_CLUB,
        Common.Addresses.Weth[1]
      );

    message = await getMessage(COOL_CATS, Common.Addresses.Weth[1]);

    await expect(
      relativeFloorBids.connect(taker).fillBid(0, message, 0)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });
});
