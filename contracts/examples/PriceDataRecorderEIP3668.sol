// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {ReservoirOracle} from "../ReservoirOracle.sol";

contract PriceDataRecorderEIP3668 is ReservoirOracle {
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

    // --- Errors ---

    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

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

    function recordPrice(address collection) external {
        string[] memory urls = new string[](1);
        urls[0] = string.concat(
            "http://localhost:3000/oracle/collections/",
            Strings.toHexString(uint160(collection), 20),
            "/floor-ask/v1?eip3668Calldata={data}"
        );

        revert OffchainLookup(
            address(this),
            urls,
            abi.encode(currency, "twap"),
            PriceDataRecorderEIP3668.recordPriceCallback.selector,
            abi.encode(collection)
        );
    }

    function recordPriceCallback(
        bytes calldata response,
        bytes calldata extraData
    ) external {
        address collection = abi.decode(extraData, (address));
        Message memory message = abi.decode(response, (Message));

        // Construct the message id on-chain (using EIP-712 structured-data hashing)
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
