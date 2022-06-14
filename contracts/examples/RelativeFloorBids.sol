// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {ReservoirOracle} from "../ReservoirOracle.sol";

contract RelativeFloorBids is ReservoirOracle {
    // --- Structs ---

    struct Order {
        address maker;
        // Id of the Reservoir oracle message for the collection's floor price
        bytes32 id;
        // Percentage off the floor price in bps
        uint256 bps;
        // Collection to bid on
        address erc721Token;
        // Token to bid with
        address erc20Token;
        bool executed;
    }

    // --- Fields ---

    Order[] public orders;

    // --- Constructor ---

    constructor()
        // Initialize with Reservoir's main oracle
        ReservoirOracle(0x32dA57E736E05f75aa4FaE2E9Be60FD904492726)
    {}

    // --- Public methods ---

    function createBid(
        bytes32 id,
        uint256 bps,
        address erc721Token,
        address erc20Token
    ) external {
        Order memory order;
        order.maker = msg.sender;
        order.id = id;
        order.bps = bps;
        order.erc721Token = erc721Token;
        order.erc20Token = erc20Token;

        orders.push(order);
    }

    function fillBid(
        uint256 orderId,
        Message calldata message,
        uint256 // tokenId
    ) external {
        Order storage order = orders[orderId];

        // Validate the message
        uint256 maxMessageAge = 5 minutes;
        if (!_verifyMessage(order.id, maxMessageAge, message)) {
            revert InvalidMessage();
        }

        (
            address messageCurrency, /* uint256 messagePrice */

        ) = abi.decode(message.payload, (address, uint256));
        require(order.erc20Token == messageCurrency, "Wrong currency");

        // For simplicity, no transfers are actually performed in this example

        // uint256 price = (messagePrice * order.bps) / 10000;

        // IERC20(order.erc20Token).transferFrom(order.maker, msg.sender, price);
        // IERC721(order.erc721Token).transferFrom(
        //     msg.sender,
        //     order.maker,
        //     tokenId
        // );
    }
}
