import {task} from 'hardhat/config'
import {boolean} from 'hardhat/internal/core/params/argumentTypes'
import {BigNumber} from 'ethers'
import {OrderBookConfig, OrderBookKey, getLighterConfig} from '../config'
import {
  isSuccessful,
  getRouterAt,
  getTokenPrecisions,
  getOrderBookTicksFromAddress,
  parseBaseAmount,
  parseBasePrice,
  OrderType,
} from '../shared'
import {CreateOrderEvent, getCreateOrderEvent} from '../shared/event-util'
import {HardhatRuntimeEnvironment} from 'hardhat/types'

export const executeOrderCreation = async (
  orderbookname: string,
  orderType: OrderType,
  amount: BigNumber,
  price: BigNumber,
  isask: boolean,
  hre: HardhatRuntimeEnvironment
) => {
  const lighterConfig = await getLighterConfig()
  const routerContract = await getRouterAt(lighterConfig.Router, hre)
  const orderBookConfig = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as OrderBookConfig

  const tokenPrecisions = await getTokenPrecisions(orderBookConfig.Address, hre)
  const tickInfo = await getOrderBookTicksFromAddress(orderBookConfig.Address, hre)
  const amountBase = parseBaseAmount(amount, tokenPrecisions.token0Precision, tickInfo.SizeTick)
  if (!amountBase || amountBase.eq(BigNumber.from(0))) {
    throw new Error(`Invalid amountBase ${amountBase}`)
  }
  const priceBase = parseBasePrice(price, tokenPrecisions.token1Precision, tickInfo.PriceTick)
  if (!priceBase || priceBase.eq(BigNumber.from(0))) {
    throw new Error(`Invalid PriceBase ${priceBase}`)
  }

  let tx

  switch (orderType) {
    case OrderType.FoKOrder: {
      tx = await routerContract.createFoKOrder(orderBookConfig.Id as BigNumber, amountBase, priceBase, isask)
      break
    }

    case OrderType.IoCOrder: {
      tx = await routerContract.createIoCOrder(orderBookConfig.Id as BigNumber, amountBase, priceBase, isask)
      break
    }

    case OrderType.LimitOrder: {
      tx = await routerContract.createLimitOrder(orderBookConfig.Id as BigNumber, amountBase, priceBase, isask, 0)
      break
    }

    default:
      throw new Error(`Failed to execute createOrder Request - Invalid/Unsupported OrderType`)
  }

  await tx.wait()
  const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

  if (successIndicator) {
    const createOrderEvent: CreateOrderEvent = await getCreateOrderEvent(
      hre.ethers.provider,
      orderBookConfig.Address,
      tx.hash,
      hre
    )
    console.log(
      `Create-Order Transaction: ${tx.hash} is successful and OrderEvent: ${JSON.stringify(
        createOrderEvent,
        null,
        2
      )} emitted`
    )
  } else {
    console.log(`Create-Order Transaction: ${tx.hash} failed`)
  }
}

// WETH-USDC
//amount = 0.2 to be parsed as amount0Base = 20 * 10**18 / 10**14 = 20 * 10**4 = 200000
//price = 1975.55 USDC to be parsed as priceBase = 1975.55 * 10**6 / 10**4 = 1975.55 * 10**2 = 197555
// npx hardhat createFillOrKillOrder --orderbookname WETH-USDC --amount 0.2 --price 1975.55 --isask true --network arbgoerli
task('createFillOrKillOrder')
  .addParam('orderbookname')
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create FillOrKill Order via Router')
  .setAction(async ({orderbookname, amount, price, isask}, hre) => {
    await executeOrderCreation(orderbookname, OrderType.FoKOrder, amount, price, isask, hre)
  })

task('createI0COrder')
  .addParam('orderbookname')
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create IoC-Order via Router')
  .setAction(async ({orderbookname, amount, price, isask}, hre) => {
    await executeOrderCreation(orderbookname, OrderType.IoCOrder, amount, price, isask, hre)
  })

//amount = 0.2 to be parsed as amount0Base = 20 * 10**18 / 10**14 = 20 * 10**4 = 200000
//price = 1975.55 USDC to be parsed as priceBase = 1975.55 * 10**6 / 10**4 = 1975.55 * 10**2 = 197555
// npx hardhat createLimitOrder --orderbookname WETH-USDC --amount 0.2 --price 1975.55 --isask true --network arbgoerli
task('createLimitOrder')
  .addParam('orderbookname')
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create Limit-Order via Router')
  .setAction(async ({orderbookname, amount, price, isask}, hre) => {
    await executeOrderCreation(orderbookname, OrderType.LimitOrder, amount, price, isask, hre)
  })
