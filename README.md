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

# CLI
The repository includes pre-configured Lighter and token addresses for the Arbitrum mainnet and Goerli testnet, conveniently stored in the `config` folder. 
Additionally, a range of Hardhat tasks are provided to facilitate command-line interactions with the Lighter protocol.
The foundation of this CLI can be expanded into a TypeScript SDK for further versatility and integration.

### Usage
Before utilizing the CLI, please ensure that you populate the `PRIVATE_KEY` environment variable within the `.env` file.
The CLI is intended for use by externally-owned accounts (normal ETH accounts) rather than smart contracts.
For this reason, it is necessary to approve the Router contract before engaging with it. 
This approval can be initiated using the `token.approveRouter` task, as demonstrated below.
```shell
npx hardhat --network arbsepolia token.approveRouter --symbol USDCE --amount 1500.0
```

## Examples

### View the Order Book
In order to offer the full experience on the CLI, you can query the Order Book to see open orders using the `getAllLimitOrders` task.
The `getAllLimitOrdersOfAnAccount` functionality filters out only the orders for a specified account.

```shell
npx hardhat --network arbsepolia getAllLimitOrders --orderbookname WETH-USDCE
# orderData queried: 
# Order Data:
#  Limit: 100
#  Total Order Count: 3
#  Ask Order Count: 1
#  Bid Order Count: 2
#
#  Ask Orders:
#
#  Owner: 0xd057E08695d1843FC21F27bBd0Af5D4B06203F48 OrderType: 0 ID: 5
#  Amount0: 0.15 Price: 1900.0
#
#  Bid Orders:
#
#  Owner: 0xd057E08695d1843FC21F27bBd0Af5D4B06203F48 OrderType: 0 ID: 6
#  Amount0: 0.35 Price: 1750.0
#
#  Owner: 0xd057E08695d1843FC21F27bBd0Af5D4B06203F48 OrderType: 0 ID: 2
#  Amount0: 0.25 Price: 1500.0
```

### SwapExactInput & SwapExactOutput
Both the SwapExactInput and SwapExactOutput tasks are designed specifically for Lighter v2, 
offering a user-friendly means to perform token swaps in an Automated Market Maker (AMM) fashion.
In the case of SwapExactInput, you specify the fixed amount of tokens you are providing, 
while for SwapExactOutput, you specify the desired amount of tokens to receive.

```shell
npx hardhat --network arbsepolia swapExactInput --orderbookname WETH-USDCE --isask false --exactinput 1.0
# swapExact Transaction: 0xb0a6f71f6d191a4862f055710fae768e8e819c6a37b28e1c7a1ad500b7359af2 successful
# swapped 0.9994 USDC.e for 0.000526 WETH

npx hardhat --network arbsepolia swapExactInput --orderbookname WETH-USDCE --isask true --exactinput 0.0005
# swapExact Transaction: 0xf0d1752e7c15bdf88dec3bcaa82bc4d1cb3ccc12bc7b36422c0dccd1a415e69c successful
# swapped 0.0005 WETH for 0.875 USDC.e

npx hardhat --network arbsepolia swapExactOutput --orderbookname WETH-USDCE --isask false --exactoutput 0.01
# swapExact Transaction: 0xd94deb8e9a5f8139a513ef79123a854e7e9ab0724420b0328dfa2b47eae29f82 successful
# swapped 19.0 USDC.e for 0.01 WETH

npx hardhat --network arbsepolia swapExactOutput --orderbookname WETH-USDCE --isask true --exactoutput 20.0
# swapExact Transaction: 0x066b8bc05f17b755d23950aaf4df8b8dccb04e4e61e91c10bd7c3dd56d6bbb13 successful
# swapped 0.011429 WETH for 20.00075 USDC.e
```


### Create Limit Order
Creating limit orders locks the tokens in the order book until the order is canceled or executed by someone else.
When creating a limit order, it may execute immediately at the best market price if the price for an ask order is too low, as illustrated in Example 1.

In Example 2, an order is depicted that enters the order book as a market order but does not execute with any other order.

Example 3 demonstrates an order that partially executes against a resting order, with the remaining portion placed in the order book.

```shell
# example 1, order executes at market price
$ npx hardhat --network arbsepolia createOrder --orderbookname WETH-USDCE --isask true --amount 0.1 --price 1200.0
# createOrder Transaction: 0x3f05bbe248e772a7a6a2681cc84f540e6aa059dd554c717cb5fe93d2d860e0f0 successful
# orderId:3 executed completely at best market price
# swaps triggered
# 0.1 WETH for 150.0 USDC.e (price of 1500.0)

# example 2, order enters the book without executing
$ npx hardhat --network arbsepolia createOrder --orderbookname WETH-USDCE --isask false --amount 0.25 --price 1900.0
# createOrder Transaction: 0x366917aa70321277d97740d15e31126967bca04d383565cbe59fc16c8f19fd1f successful
# orderId:4 resting amount 0.25 @ 1900.0
# no swaps triggered

# example 3, order executes partially at best market price
$ npx hardhat --network arbsepolia createOrder --orderbookname WETH-USDCE --isask true --amount 0.4 --price 1900.0
# createOrder Transaction: 0x9cdf5d08727426b20617dd02a7a54141d251885b549b16fdd8c7f02cb901e766 successful
# orderId:5 resting amount 0.15 @ 1900.0
# swaps triggered
# 0.25 WETH for 475.0 USDC.e (price of 1900.0)
```


### Cancel Limit Order
Once a limit order has been created, the funds are locked in the order book at the specified price and quantity. If the order has not been fully executed, it can be canceled, and the remaining tokens will be returned to the owner.

It's important to note that sending a transaction is not an atomic action, which means that the order can still be matched against until the transaction is processed and executed.

```shell
# canceling order with id 2
$ npx hardhat --network arbsepolia cancelOrder --orderbookname WETH-USDCE --id 2
# cancelOrder Transaction: 0xedc11def59c251627215f3d7078f1385fb9cbbcb1cc8af91c5b67c4717b2eb46 successful
# orderId:2

# order with id 6 is already executed, so there's nothing to cancel
$ npx hardhat --network arbsepolia cancelOrder --orderbookname WETH-USDCE --id 6
# order already canceled or not active
```
