const axios = require("axios");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RelativeFloorBids", () => {
  let deployer;
  let maker;
  let taker;

  let relativeFloorBids;

  // --- Constants ---

  const BORED_APE_YACHT_CLUB = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
  const COOL_CATS = "0x1a92f7381b9f03921564a437210bb9396471050c";
  const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  // --- Setup ---

  beforeEach(async () => {
    [deployer, maker, taker] = await ethers.getSigners();

    relativeFloorBids = await ethers
      .getContractFactory("RelativeFloorBids", deployer)
      .then((factory) => factory.deploy());
  });

  const getMessage = async (collection) => {
    const baseUrl = "https://api.reservoir.tools/oracle/collections";

    const name = "RelativeFloorBids";
    const version = "1";
    const contract = relativeFloorBids.address;

    return axios
      .get(
        `${baseUrl}/${collection}/floor-ask/v1?contractName=${name}&contractVersion=${version}&verifyingContract=${contract}&kind=twap`
      )
      .then((response) => response.data.message);
  };

  // --- Tests ---

  it("Fill bid", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);

    // Create bid at 80% of the floor price
    await relativeFloorBids
      .connect(maker)
      .createBid(message.id, 8000, BORED_APE_YACHT_CLUB, WETH);

    await relativeFloorBids.connect(taker).fillBid(0, message, 0);
  });

  it("Cannot fill bid when given an expired message", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);

    // Create bid at 80% of the floor price
    await relativeFloorBids
      .connect(maker)
      .createBid(message.id, 8000, BORED_APE_YACHT_CLUB, WETH);

    await network.provider.send("evm_increaseTime", [2 * 60]);

    await expect(
      relativeFloorBids.connect(taker).fillBid(0, message, 0)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });

  it("Cannot fill bid when given an invalid signature", async () => {
    const message = await getMessage(BORED_APE_YACHT_CLUB);

    // Create bid at 80% of the floor price
    await relativeFloorBids
      .connect(maker)
      .createBid(message.id, 8000, BORED_APE_YACHT_CLUB, WETH);

    message.signature = message.signature.slice(0, -2) + "00";

    await expect(
      relativeFloorBids.connect(taker).fillBid(0, message, 0)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });

  it("Cannot record price from non-matching collection", async () => {
    let message = await getMessage(BORED_APE_YACHT_CLUB);

    // Create bid at 80% of the floor price
    await relativeFloorBids
      .connect(maker)
      .createBid(message.id, 8000, BORED_APE_YACHT_CLUB, WETH);

    message = await getMessage(COOL_CATS);

    await expect(
      relativeFloorBids.connect(taker).fillBid(0, message, 0)
    ).to.be.revertedWith("reverted with custom error 'InvalidMessage()'");
  });
});
