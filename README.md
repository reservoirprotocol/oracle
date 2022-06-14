# Reservoir Oracle

This repo provides a template together with some examples for using the Reservoir-powered NFT oracle. Inspired by [Trustus](https://github.com/ZeframLou/trustus), the way the oracle works is by signing messages off-chain, which can then be relayed and verifier on-chain.

### Message types

At the moment, the following message types are available via the hosted Reservoir API:

- [collection floor price](https://api.reservoir.tools/#/oracle/getOracleCollectionsCollectionFlooraskV1) (spot, 24 hour twap, lower (`min(spot, 25 hour twap)`) and upper (`max(spot, 24 hours twap)`))

### Usage and examples

Examples for integrating the Reservoir-powered oracle are available in the [examples](./contracts/examples) and [test](./test) directories.

### Deployed contracts

Kovan:

- `BAYC / USDC` `DataFeedOracleAdaptor`: https://kovan.etherscan.io/address/0xC5B29989e47bb0a17B0870b027BE26522d654BF5#readContract
- `CHIMP / USDC` `DataFeedOracleAdaptor`: https://kovan.etherscan.io/address/0x8fF91c16a42c45D20F4A0806afb5ab9C9112f472#readContract
