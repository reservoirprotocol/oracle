# Reservoir Oracle

This repo provides a template together with some examples for using the Reservoir-powered NFT oracle. Inspired by [Trustus](https://github.com/ZeframLou/trustus), the way the oracle works is by signing messages off-chain, which can then be relayed and verifier on-chain.

### Message types

At the moment, the following message types are available via the hosted Reservoir API:

- [collection floor price](https://api.reservoir.tools/#/oracle/getOracleCollectionsCollectionFlooraskV1) (spot, 24 hour twap, lower (`min(spot, 25 hour twap)`) and upper (`max(spot, 24 hours twap)`))

### Usage and examples

Examples for integrating the Reservoir-powered oracle are available in the [examples](./contracts/examples) and [test](./test) directories.
