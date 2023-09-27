# lighter-v2-example

Examples of integrations with Lighter v2 exchange

# Contracts
The repository includes three sample wallets, providing a foundation for those interested in integrating with or using the Lighter exchange. 
Alongside the contracts are tests that fork the Arbitrum mainnet for testing purposes. 
Users have the flexibility to modify these contracts or extract the integration components for use in other contracts. 
The tests are also designed for extensibility, ensuring comprehensive validation of any final contract modifications.

For a detailed overview of the protocol and its features, refer to the [documentation](https://docs.lighter.xyz/lighter-dex/).

## [Swap Wallet](./contracts/SwapWallet.sol)
A wallet that interacts with the Lighter protocol by performing AMM-style token swaps. 
Supported functions include swapExactInput and swapExactOutput.
Serves as a starting point for users who wish to execute simple trades on the Lighter exchange.

## [Market Making Wallet](./contracts/MarketMakingWallet.sol)
A wallet that interacts with the Lighter protocol by placing optimized limit orders.
An optimized limit order, known as a PerformanceLimitOrder, differs from a standard LimitOrder in that it first
deposits the tokens into the order book. This eliminates the need for the order book to execute transfers each time
an order is created or canceled, thereby reducing gas costs.
Serves as a starting point for users who wish to place resting orders on Lighter (i.e., to market make).

## [Margin Wallet](./contracts/MarginWallet.sol)
A contract that functions as a margin account.
Funds deposited into this wallet are used as collateral in the AAVE protocol.
Trading on Lighter leverages the credit provided by the AAVE protocol.
If a swap is initiated with insufficient deposited tokens, a loan will be taken to cover the remaining costs.
This implementation does not use Flash Loans, thereby avoiding extra costs.
Due to the nature of margin accounts, liquidation is a possibility.

## [View Wallet](./contracts/ViewWallet.sol)
A wallet that extends the Lighter protocol by providing more view methods.
It offers methods like `getLimitOrders` and `getLimitOrdersByOwner`. 
Inherited by the Market Making Wallet, enabling an atomic `cancelAllLimitOrders` method.
