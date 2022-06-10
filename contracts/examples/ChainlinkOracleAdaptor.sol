// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {ReservoirOracle} from "../ReservoirOracle.sol";

contract ChainlinkOracleAdaptor is AggregatorV3Interface, ReservoirOracle {
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

    bytes32 public messageId;
    OracleResult[] public oracleResults;

    // --- Constructor ---

    constructor(address collection)
        // Initialize with Reservoir's main oracle
        ReservoirOracle(0x32dA57E736E05f75aa4FaE2E9Be60FD904492726)
    {
        messageId = keccak256(
            abi.encode(
                keccak256(
                    "ContractWideCollectionPrice(uint8 kind,address contract)"
                ),
                1, // PriceKind.TWAP
                collection
            )
        );

        description = string.concat(
            IERC721Metadata(collection).symbol(),
            " / ETH"
        );
    }

    // --- Public methods ---

    function recordPrice(Message calldata message) external {
        // Validate the message
        uint256 maxMessageAge = 5 minutes;
        if (!_verifyMessage(messageId, maxMessageAge, message)) {
            revert InvalidMessage();
        }

        OracleResult memory oracleResult;
        oracleResult.roundId = uint80(oracleResults.length);
        oracleResult.answer = int256(abi.decode(message.payload, (uint256)));
        oracleResult.startedAt = block.timestamp;
        oracleResult.updatedAt = block.timestamp;
        oracleResult.answeredInRound = uint80(oracleResults.length);

        oracleResults.push(oracleResult);
    }

    // --- Overrides ---

    uint256 public override version = 3;
    uint8 public override decimals = 18;
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
                keccak256("ChainlinkOracleAdaptor"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }
}
