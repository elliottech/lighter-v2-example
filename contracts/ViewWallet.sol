// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IOrderBook} from "@elliottech/lighter-v2-core/contracts/interfaces/IOrderBook.sol";

/// @title ViewWallet
/// @notice A wallet that extends the Lighter protocol by providing more view methods.
contract ViewWallet {
    constructor() {}

    struct Order {
        bool isAsk;
        uint32 id;
        address owner;
        uint256 amount0;
        uint256 price;
    }

    /// @notice Get the order details of all limit orders in the order book.
    /// Each returned list contains the details of ask orders first, followed by bid orders
    function getLimitOrders(IOrderBook orderBook) public view returns (Order[] memory) {
        uint32 limit = 100;
        uint32 total = 0;

        // iterate once to get the total number of orders first
        for (uint8 ask = 1; ; ask -= 1) {
            uint32 lastId = 0;
            for (bool broke = false; broke == false; ) {
                IOrderBook.OrderQueryItem memory response = orderBook.getPaginatedOrders(lastId, ask == 1, limit);
                for (uint32 index = 0; index < limit; index += 1) {
                    lastId = response.ids[index];
                    if (lastId == 0) {
                        broke = true;
                        break;
                    }
                    total += 1;
                }
            }
            if (ask == 0) {
                break;
            }
        }

        Order[] memory orders = new Order[](total);
        total = 0;

        // iterate again and store the response where
        for (uint8 ask = 1; ; ask -= 1) {
            uint32 lastId = 0;
            for (bool broke = false; broke == false; ) {
                IOrderBook.OrderQueryItem memory response = orderBook.getPaginatedOrders(lastId, ask == 1, limit);
                for (uint32 index = 0; index < limit; index += 1) {
                    lastId = response.ids[index];
                    if (lastId == 0) {
                        broke = true;
                        break;
                    }

                    orders[total] = Order({
                        isAsk: response.isAsk,
                        id: response.ids[index],
                        owner: response.owners[index],
                        amount0: response.amount0s[index],
                        price: response.prices[index]
                    });
                    total += 1;
                }
            }
            if (ask == 0) {
                break;
            }
        }

        return orders;
    }

    /// @notice Get the order details of all limit orders in the order book.
    /// Each returned list contains the details of ask orders first, followed by bid orders
    function getLimitOrdersByOwner(IOrderBook orderBook, address ownerAddress) public view returns (Order[] memory) {
        Order[] memory orders = getLimitOrders(orderBook);
        uint32 total = 0;
        for (uint256 index = 0; index < orders.length; index += 1) {
            if (orders[index].owner == ownerAddress) {
                total += 1;
            }
        }

        Order[] memory filteredOrders = new Order[](total);
        total = 0;

        for (uint256 index = 0; index < orders.length; index += 1) {
            if (orders[index].owner == ownerAddress) {
                filteredOrders[total] = orders[index];
                total += 1;
            }
        }

        return filteredOrders;
    }
}
