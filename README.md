The Reservoir Oracle enables access to Reservoir’s comprehensive aggregated NFT prices in on-chain applications and protocols. 

## Available Data

In the current Alpha release, you can get the collection floor price for any NFT contract on Ethereum, with the following options:

**Methodology**: Spot, 24hr TWAP, Upper (`max(Spot,TWAP)`) or Lower (`min(Spot,TWAP)`)  
**Currency**: ETH, WETH or USDC

## Modes

The Oracle supports two modes, depending on the type of data that you need:

**On-Demand** > Bring floor prices for ANY collection on-chain when users take actions  
**Feeds** > Access regularly published floor data for the most popular NFT collections

Each mode has a different usage flow, which are outlined below:

## On-Demand

In most-cases, we recommend using On-Demand oracle updates. These have the following advantages:

- Flexibility to support any NFT collection, pricing methodology or currency
- Get fresh updates whenever users take actions

On-demand updates effectively “piggyback” user transactions, with the following flow:

- User takes an action in a Dapp
- Dapp requests a price update from the [Oracle API](https://docs.reservoir.tools/reference/getoraclecollectionscollectionflooraskv1) in the background
- Dapp builds the users’ transaction, including the signed Oracle update
- User signs and submits the transaction
- Contract validates the Oracle update, and processes user transaction

The [signed message format](https://github.com/reservoirprotocol/oracle/blob/main/contracts/ReservoirOracle.sol) is based on [TrustUs](https://github.com/ZeframLou/trustus), with some minor modifications.

## Feeds

For popular NFT projects, we publish hourly price data that your contract can connect to. These feeds use the exact same format as [Chainlink Data Feeds](https://docs.chain.link/docs/get-the-latest-price/), to maximize compatibility with existing Oracle tooling. 

We currently publish the following feeds, on Kovan:

- [Bored Ape Yacht Club](https://kovan.etherscan.io/address/0xC5B29989e47bb0a17B0870b027BE26522d654BF5#readContract), 24hr TWAP, USDC 
- [Chimpers](https://kovan.etherscan.io/address/0x8fF91c16a42c45D20F4A0806afb5ab9C9112f472#readContract), 24hr TWAP, USDC

To access the current price, use the `latestAnswer` value.

## Examples

The following examples are available:

[RelativeFloorBids.sol](https://github.com/reservoirprotocol/oracle/blob/main/contracts/examples/RelativeFloorBids.sol)  
Create collection-wide bids with dynamic pricing relative to the collection floor

[PriceDataRecorder.sol](https://github.com/reservoirprotocol/oracle/blob/main/contracts/examples/PriceDataRecorder.sol)  
Simple example that saves the results of on-demand oracle updates

[PriceDataRecorderEIP3668.sol](https://github.com/reservoirprotocol/oracle/blob/main/contracts/examples/PriceDataRecorderEIP3668.sol)  
Same as above, using the [EIP3668: Secure offchain data retrieval](https://eips.ethereum.org/EIPS/eip-3668) standard

[DataFeedOracleAdaptor.sol](https://github.com/reservoirprotocol/oracle/blob/main/contracts/examples/DataFeedOracleAdaptor.sol)  
Example Chainlink-compatible price feed
