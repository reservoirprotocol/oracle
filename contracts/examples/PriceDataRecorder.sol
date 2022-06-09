// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {ReservoirOracle} from "../ReservoirOracle.sol";

contract PriceDataRecorder is ReservoirOracle {
    // --- Enums ---

    enum PriceKind {
        SPOT,
        TWAP,
        LOWER,
        UPPER
    }

    // --- Structs ---

    struct PriceData {
        uint256 timestamp;
        uint256 price;
    }

    // --- Fields ---

    mapping(address => PriceData[]) public priceData;

    // --- Constructor ---

    constructor()
        // Initialize with Reservoir's main oracle
        ReservoirOracle(0x32dA57E736E05f75aa4FaE2E9Be60FD904492726)
    {}

    // --- Public methods ---

    function recordPrice(address collection, Message calldata message)
        external
    {
        // Construct the message id on-chain
        bytes32 id = keccak256(
            abi.encode(
                keccak256(
                    "ContractWideCollectionPrice(uint8 kind,address contract)"
                ),
                PriceKind.TWAP,
                collection
            )
        );

        // Validate the message
        uint256 maxMessageAge = 5 minutes;
        if (!_verifyMessage(id, maxMessageAge, message)) {
            revert InvalidMessage();
        }

        PriceData memory newPriceData;
        newPriceData.timestamp = block.timestamp;
        newPriceData.price = abi.decode(message.payload, (uint256));

        // Record the price information for the collection
        priceData[collection].push(newPriceData);
    }

    // --- Overrides ---

    function _getDomainSeparator()
        internal
        view
        override
        returns (bytes32 domainSeparator)
    {
        domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256("PriceDataRecorder"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }
}
