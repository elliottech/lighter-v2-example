import {task} from 'hardhat/config'
import {boolean, int} from 'hardhat/internal/core/params/argumentTypes'
import {BigNumber} from 'ethers'
import {LighterEventWrapper, OrderBookKey, getLighterConfig} from '../config'
import {
  isSuccessful,
  getRouterAt,
  parseBaseAmount,
  parseBasePrice,
  getOrderBookConfigFromAddress,
  getAllLighterEvents,
  getOrderFallbackData,
} from '../shared'
import {OrderType, getOrderTypeString} from '../config'
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
  const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
  const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
  const amountBase = parseBaseAmount(amount, orderBookConfig.token0Precision, orderBookConfig.sizeTick)
  if (!amountBase || amountBase.eq(BigNumber.from(0))) {
    throw new Error(`Invalid amountBase ${amountBase}`)
  }
  const priceBase = parseBasePrice(price, orderBookConfig.token1Precision, orderBookConfig.priceTick)
  if (!priceBase || priceBase.eq(BigNumber.from(0))) {
    throw new Error(`Invalid PriceBase ${priceBase}`)
  }

  let tx

  switch (orderType) {
    case OrderType.FoKOrder: {
      tx = await routerContract.createFoKOrder(orderBookConfig.orderBookId, amountBase, priceBase, isask)
      break
    }

    case OrderType.IoCOrder: {
      tx = await routerContract.createIoCOrder(orderBookConfig.orderBookId, amountBase, priceBase, isask)
      break
    }

    case OrderType.LimitOrder: {
      tx = await routerContract.createLimitOrder(orderBookConfig.orderBookId, amountBase, priceBase, isask, 0)
      break
    }

    default:
      throw new Error(`Failed to execute createOrder Request - Invalid/Unsupported OrderType`)
  }

  const orderTypeDescription = getOrderTypeString(orderType)

  await tx.wait()
  const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

  if (successIndicator) {
    const lighterEventWrapper: LighterEventWrapper = await getAllLighterEvents(orderBookAddress, tx.hash, hre)
    console.log(
      `Create-${orderTypeDescription} Transaction: ${tx.hash} is successful and OrderEvent: ${JSON.stringify(
        lighterEventWrapper,
        null,
        2
      )} emitted`
    )
  } else {
    console.log(`Create-${orderTypeDescription} Transaction: ${tx.hash} failed`)
  }
}

export const executeFallbackOrderCreation = async (
  orderbookname: string,
  orderType: OrderType,
  amount: BigNumber,
  price: BigNumber,
  isask: boolean,
  hre: HardhatRuntimeEnvironment
) => {
  const lighterConfig = await getLighterConfig()
  const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
  const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
  const amountBase = parseBaseAmount(amount, orderBookConfig.token0Precision, orderBookConfig.sizeTick)
  if (!amountBase || amountBase.eq(BigNumber.from(0))) {
    throw new Error(`Invalid amountBase ${amountBase}`)
  }
  const priceBase = parseBasePrice(price, orderBookConfig.token1Precision, orderBookConfig.priceTick)
  if (!priceBase || priceBase.eq(BigNumber.from(0))) {
    throw new Error(`Invalid PriceBase ${priceBase}`)
  }

  const txData = getOrderFallbackData(orderBookConfig.orderBookId, orderType, amountBase, priceBase, isask)

  const signers = await hre.ethers.getSigners()

  await signers[0].sendTransaction({
    to: lighterConfig.Router,
    data: txData,
  })
}

// create limit-order
// npx hardhat createOrder --orderbookname WETH-USDC --ordertype 0 --amount 1 --price 2000 --isask true --network arbgoerli
// npx hardhat createOrder --orderbookname WETH-USDC --amount 0.2 --price 1975.55 --isask true --network arbgoerli

//create fillOrKill-order
// npx hardhat createOrder --orderbookname WETH-USDC --ordertype 2 --amount 0.2 --price 1975.55 --isask false --network arbgoerli

//create ioc-order
// npx hardhat createOrder --orderbookname WETH-USDC --ordertype 0 --amount 0.2 --price 1975.55 --isask true --network arbgoerli
task('createOrder')
  .addParam('orderbookname')
  .addParam('ordertype', 'orderType can take values: 0 for fokOrder, 1 for iocOrder and 2 for limitOrder', 2, int, true)
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create FillOrKill Order via Router')
  .setAction(async ({orderbookname, ordertype, amount, price, isask}, hre) => {
    await executeFallbackOrderCreation(orderbookname, ordertype as OrderType, amount, price, isask, hre)
  })
