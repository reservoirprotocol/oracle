// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {ReservoirOracle} from "../ReservoirOracle.sol";

contract DataFeedOracleAdaptor is AggregatorV3Interface, ReservoirOracle {
    // --- Structs ---

    struct OracleResult {
        uint80 roundId;
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }

    // --- Errors ---

    error NoDataPresent();

    // --- Fields ---

    address public currency;
    bytes32 public messageId;
    OracleResult[] public oracleResults;

    // --- Constructor ---

    constructor(
        address collectionAddress,
        address currencyAddress,
        string memory feedDescription
    )
        // Initialize with Reservoir's main oracle
        ReservoirOracle(0x32dA57E736E05f75aa4FaE2E9Be60FD904492726)
    {
        currency = currencyAddress;

        // Construct the message id corresponding to the collection (using EIP-712 structured-data hashing)
        messageId = keccak256(
            abi.encode(
                keccak256(
                    "ContractWideCollectionPrice(uint8 kind,uint256 twapHours,address contract)"
                ),
                1, // PriceKind.TWAP
                24, // 24 hours TWAP
                collectionAddress
            )
        );

        decimals = currencyAddress == address(0)
            ? 18
            : IERC20Metadata(currencyAddress).decimals();

        description = feedDescription;
    }

    // --- Public methods ---

    function recordPrice(Message calldata message) external {
        // Validate the message
        uint256 maxMessageAge = 5 minutes;
        if (!_verifyMessage(messageId, maxMessageAge, message)) {
            revert InvalidMessage();
        }

        (address messageCurrency, uint256 price) = abi.decode(
            message.payload,
            (address, uint256)
        );
        require(currency == messageCurrency, "Wrong currency");

        OracleResult memory oracleResult;
        oracleResult.roundId = uint80(oracleResults.length);
        oracleResult.answer = int256(price);
        oracleResult.startedAt = block.timestamp;
        oracleResult.updatedAt = block.timestamp;
        oracleResult.answeredInRound = uint80(oracleResults.length);

        oracleResults.push(oracleResult);
    }

    // --- Overrides ---

    uint256 public override version = 3;
    uint8 public override decimals;
    string public override description;

    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        if (_roundId >= oracleResults.length) {
            revert NoDataPresent();
        }

        OracleResult memory oracleResult = oracleResults[_roundId];
        return (
            oracleResult.roundId,
            oracleResult.answer,
            oracleResult.startedAt,
            oracleResult.updatedAt,
            oracleResult.answeredInRound
        );
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        if (oracleResults.length == 0) {
            revert NoDataPresent();
        }

        OracleResult memory oracleResult = oracleResults[
            oracleResults.length - 1
        ];
        return (
            oracleResult.roundId,
            oracleResult.answer,
            oracleResult.startedAt,
            oracleResult.updatedAt,
            oracleResult.answeredInRound
        );
    }
}
