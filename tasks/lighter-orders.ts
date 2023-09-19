import {task} from 'hardhat/config'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {boolean} from 'hardhat/internal/core/params/argumentTypes'
import {BigNumber} from 'ethers'
import {OrderBookConfig, OrderBookKey, getLighterConfig, parseBaseAmount, parseBasePrice} from '../config'
import {isSuccessful, getRouterAt} from '../shared'

// WETH-USDC
//amount = 0.2 to be parsed as amount0Base = 20 * 10**18 / 10**14 = 20 * 10**4 = 200000
//price = 1975.55 USDC to be parsed as priceBase = 1975.55 * 10**6 / 10**4 = 1975.55 * 10**2 = 197555
// npx hardhat createFillOrKillOrder --orderBookName WETH-USDC --amount 0.2 --price 1975.55 --isask true  --network arbgoerli
task('createFillOrKillOrder')
  .addParam('orderBookName')
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create FillOrKill Order via Router')
  .setAction(async ({orderBookName, amount, price, isask}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
    const orderBookConfig = lighterConfig.OrderBooks[orderBookName as OrderBookKey] as OrderBookConfig
    const amountBase = parseBaseAmount(amount, orderBookName as OrderBookKey, orderBookConfig)
    const priceBase = parseBasePrice(price, orderBookName as OrderBookKey, orderBookConfig)
    const tx = await (
      await routerContract
    ).createFoKOrder(orderBookConfig.Id as BigNumber, amountBase, priceBase, isask)
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      console.log(`FillOrKill Order Transaction: ${tx.hash} is successful`)
    } else {
      console.log(`FillOrKill Order Transaction: ${tx.hash} failed`)
    }
  })

task('createI0COrder')
  .addParam('orderBookName')
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create IoC-Order via Router')
  .setAction(async ({orderBookName, amount, price, isask}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
    const orderBookConfig = lighterConfig.OrderBooks[orderBookName as OrderBookKey] as OrderBookConfig
    const amountBase = parseBaseAmount(amount, orderBookName as OrderBookKey, orderBookConfig)
    const priceBase = parseBasePrice(price, orderBookName as OrderBookKey, orderBookConfig)
    const tx = await (
      await routerContract
    ).createIoCOrder(orderBookConfig.Id as BigNumber, amountBase, priceBase, isask)
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      console.log(`IoC-Order Transaction: ${tx.hash} is successful`)
    } else {
      console.log(`IoC-Order Transaction: ${tx.hash} failed`)
    }
  })

task('createLimitOrder')
  .addParam('orderBookName')
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create Limit-Order via Router')
  .setAction(async ({orderBookName, amount, price, isask}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
    const orderBookConfig = lighterConfig.OrderBooks[orderBookName as OrderBookKey] as OrderBookConfig
    const amountBase = parseBaseAmount(amount, orderBookName as OrderBookKey, orderBookConfig)
    const priceBase = parseBasePrice(price, orderBookName as OrderBookKey, orderBookConfig)
    const tx = await (
      await routerContract
    ).createLimitOrder(orderBookConfig.Id as BigNumber, amountBase, priceBase, isask, 0)
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      console.log(`Limit-Order Transaction: ${tx.hash} is successful`)
    } else {
      console.log(`Limit-Order Transaction: ${tx.hash} failed`)
    }
  })
