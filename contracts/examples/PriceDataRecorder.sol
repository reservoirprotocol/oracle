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

    address public currency;
    mapping(address => PriceData[]) public priceData;

    // --- Constructor ---

    constructor(address currencyAddress)
        // Initialize with Reservoir's main oracle
        ReservoirOracle(0x32dA57E736E05f75aa4FaE2E9Be60FD904492726)
    {
        currency = currencyAddress;
    }

    // --- Public methods ---

    function recordPrice(address collection, Message calldata message)
        external
    {
        // Construct the message id on-chain (using EIP-712 structured-data hashing)
        bytes32 id = keccak256(
            abi.encode(
                keccak256(
                    "ContractWideCollectionPrice(uint8 kind,uint256 twapHours,address contract)"
                ),
                PriceKind.TWAP,
                24,
                collection
            )
        );

        // Validate the message
        uint256 maxMessageAge = 5 minutes;
        if (!_verifyMessage(id, maxMessageAge, message)) {
            revert InvalidMessage();
        }

        (address messageCurrency, uint256 price) = abi.decode(
            message.payload,
            (address, uint256)
        );
        require(currency == messageCurrency, "Wrong currency");

        PriceData memory newPriceData;
        newPriceData.timestamp = block.timestamp;
        newPriceData.price = price;

        // Record the price information for the collection
        priceData[collection].push(newPriceData);
    }
}
