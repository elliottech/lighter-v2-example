# SDK

The TypeScript SDK is a streamlined collection of utilities designed to simplify interactions with the Lighter Exchange.
Currently, the V2 contracts are deployed on the following networks, with all contract addresses configured in the `config/` package:
- Arbitrum Mainnet
- Arbitrum Sepolia
- Polygon Mumbai
- Binance Smart Chain testnet
- Optimism Goerli

## Components of the SDK include
### Fallback compression
`fallback.ts` is an independent file responsible for managing calldata compression for all Lighter actions. 
Note that when creating limit orders, the arguments are passed as `base0Amount` and `basePrice`, which are compacted to be smaller. 
The precision that is omitted depends on the OrderBook and can be retrieved using the `getOrderBookConfigFromAddress` method.
You must divide your amount by `sizeTick` and the price by `sizeTick`.

### Events parsing
The function `getAllLighterEvents(transactionHash: string, provider: ethers.providers.JsonRpcProvider)` 
extracts and parses all events emitted by the Lighter protocol from a specified transaction. 
An interface is outlined for each type of `LighterEvent`. The Lighter events include:
- `CreateOrderEvent`
- `CancelLimitOrderEvent`
- `SwapEvent`
- `SwapExactAmountEvent`
- `FlashLoanEvent`
- `ClaimableBalanceIncreaseEvent`
- `ClaimableBalanceDecreaseEvent`

### Contracts
`contract.ts` provides methods to initialize all Lighter contracts and ERC20 Tokens. The methods include:
- `getOrderBookAt`
- `getFactoryAt`
- `getTokenAt`

Additionally, `getOrderBookConfigFromAddress` generates a comprehensive config object containing details specific to the order book.
Note that this method involves numerous asynchronous calls, and caching the result may be beneficial to optimize performance.

### Orders
`orders.ts` encompasses methods to query the Order Books. 
Among these is `getAllLimitOrders`, a paginated endpoint designed to retrieve active orders. 
Generally, invoking it with `startOrderId=0` and `limit=100` should cover most scenarios.

It's important to note that if an order is positioned deep in the OrderBook (beyond the top 100 orders), 
it may not be returned by this query, though it still exists. 
To fetch all user orders without querying the entire OrderBook, consider using the [LighterApi](https://docs.lighter.xyz/lighter-dex/developers/lighter-api).

Additional useful methods include:
- `orderToString`: Serializes an order
- `orderDataToString`: Serializes a snapshot of the OrderBook
- `getAllLimitOrdersOfAnAccount`: Filters orders belonging to a specific owner
- `getOrderDetails`: Retrieves a single order
- `getAllLimitOrdersBySide`: Similar to `getAllLimitOrders`, but targets only one side of the OrderBook
