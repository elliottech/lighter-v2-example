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
npx hardhat --network arbgoerli token.approveRouter --symbol USDC --amount 1500.0
```

## Examples
### SwapExactInput & SwapExactOutput
Both the SwapExactInput and SwapExactOutput tasks are designed specifically for Lighter v2, 
offering a user-friendly means to perform token swaps in an Automated Market Maker (AMM) fashion.
In the case of SwapExactInput, you specify the fixed amount of tokens you are providing, 
while for SwapExactOutput, you specify the desired amount of tokens to receive.

```shell
npx hardhat --network arbgoerli swapExactInput --orderbookname WETH-USDC --isask false --exactinput 1.0
# swapExact Transaction: 0x6027a34ef33a2dc261cc4ba493c8e7704611bf7ac9402db62e9aa2b257f5a7f5 successful
# swapped 1.0 USDC for 0.0005 WETH

npx hardhat --network arbgoerli swapExactInput --orderbookname WETH-USDC --isask true --exactinput 0.0005
# swapExact Transaction: 0x5f04469639004ae1bb9f53def5af6525ca2e5394f2dcc524ef77dddea1f92a05 successful
# swapped 0.0005 WETH for 0.75 USDC

npx hardhat --network arbgoerli swapExactOutput --orderbookname WETH-USDC --isask false --exactoutput 0.01
# swapExact Transaction: 0x9ec60cd4fa323ef2bf46b53b58a1e4fc5d314e4940c358f772a802ed3f7b0f63 successful
# swapped 20.0 USDC for 0.01 WETH

npx hardhat --network arbgoerli swapExactOutput --orderbookname WETH-USDC --isask true --exactoutput 20.0
# swapExact Transaction: 0x900d43096c82f6d0e50f9b7e1b6291403bc83d2d93f0391538481839fc407cec successful
# swapped 0.01334 WETH for 20.01 USDC
```
