import {task} from 'hardhat/config'
import {boolean, int} from 'hardhat/internal/core/params/argumentTypes'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {BigNumber, ContractTransaction} from 'ethers'
import {formatUnits} from 'ethers/lib/utils'
import {parseToAmountBase, parseToPriceBase} from './utils'
import {
  CancelLimitOrderEvent,
  CreateOrderEvent,
  LighterEventType,
  OrderBookConfig,
  OrderBookKey,
  SwapEvent,
  getAllLighterEvents,
  getCancelLimitOrderFallbackData,
  getCreateFOKOrderFallbackData,
  getCreateIOCOrderFallbackData,
  getCreateLimitOrderFallbackData,
  getLighterConfig,
  getOrderBookConfigFromAddress,
} from '../sdk'

async function printCreateOrderExecution(
  tx: ContractTransaction,
  orderBookConfig: OrderBookConfig,
  hre: HardhatRuntimeEnvironment
) {
  await tx.wait()

  const allEvents = await getAllLighterEvents(tx.hash, hre)
  let createOrderEvent: CreateOrderEvent | null = null
  let swapEvents: SwapEvent[] = []
  for (const event of allEvents) {
    if (event.eventName == LighterEventType.CREATE_ORDER_EVENT) {
      createOrderEvent = event as CreateOrderEvent
    }
    if (event.eventName == LighterEventType.SWAP_EVENT) {
      swapEvents.push(event as SwapEvent)
    }
  }

  if (createOrderEvent == null) {
    console.warn(`no order was created but transaction was successful`)
    return
  }

  let remainingAmount0 = createOrderEvent.amount0Base.mul(orderBookConfig.sizeTick)
  let price = createOrderEvent.priceBase.mul(orderBookConfig.priceTick)
  for (const swap of swapEvents) {
    remainingAmount0 = remainingAmount0.sub(swap.amount0)
  }

  console.log(
    `createOrder Transaction: ${tx.hash} successful\n` +
      `orderId:${createOrderEvent.id} ` +
      (remainingAmount0.eq(0)
        ? `executed completely at best market price`
        : `resting amount ${formatUnits(remainingAmount0, orderBookConfig.token0Precision)} ` +
          `@ ${formatUnits(price, orderBookConfig.token1Precision)}`)
  )

  if (swapEvents.length == 0) {
    console.log('no swaps triggered')
  } else {
    console.log('swaps triggered')
    for (const swap of swapEvents) {
      const price = swap.amount1.mul(BigNumber.from(10).pow(orderBookConfig.token0Precision)).div(swap.amount0)

      if (createOrderEvent.isAsk) {
        console.log(
          `${formatUnits(swap.amount0, orderBookConfig.token0Precision)} ${orderBookConfig.token0Symbol} for ` +
            `${formatUnits(swap.amount1, orderBookConfig.token1Precision)} ${orderBookConfig.token1Symbol} ` +
            `(price of ${formatUnits(price, orderBookConfig.token1Precision)})`
        )
      } else {
        console.log(
          `${formatUnits(swap.amount1, orderBookConfig.token1Precision)} ${orderBookConfig.token1Symbol} for ` +
            `${formatUnits(swap.amount0, orderBookConfig.token0Precision)} ${orderBookConfig.token0Symbol} ` +
            `(price of ${formatUnits(price, orderBookConfig.token1Precision)})`
        )
      }
    }
  }
}

task('createOrder')
  .addParam('orderbookname')
  .addParam('ordertype', 'orderType can take values: 0 for LimitOrder, 2 for FoKOrder and 3 for IoCOrder', 0, int, true)
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create Limit Order via Router')
  .setAction(async ({orderbookname, ordertype, amount: amountStr, price: priceStr, isask}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
    if (!orderBookAddress) {
      throw new Error(`Invalid order book '${orderbookname}'`)
    }

    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)

    const amountBase = parseToAmountBase(amountStr, orderBookConfig)
    const priceBase = parseToPriceBase(priceStr, orderBookConfig)

    // make sure min amounts for order are satisfied
    if (orderBookConfig.minToken0BaseAmount.gt(amountBase)) {
      throw `amount0 (${orderBookConfig.token0Symbol}) too small (increase amount of order)`
    }
    if (orderBookConfig.minToken1BaseAmount.gt(amountBase.mul(priceBase))) {
      throw `amount1 (${orderBookConfig.token1Symbol}) too small (increase price or amount of order)`
    }

    let data = ''
    if (ordertype == 0) {
      data = getCreateLimitOrderFallbackData(orderBookConfig.orderBookId, [
        {
          amount0Base: amountBase,
          priceBase: priceBase,
          isAsk: isask,
          hintId: 0,
        },
      ])
    } else if (ordertype == 2) {
      data = getCreateFOKOrderFallbackData(orderBookConfig.orderBookId, {
        amount0Base: amountBase,
        priceBase: priceBase,
        isAsk: isask,
      })
    } else if (ordertype == 3) {
      data = getCreateIOCOrderFallbackData(orderBookConfig.orderBookId, {
        amount0Base: amountBase,
        priceBase: priceBase,
        isAsk: isask,
      })
    } else {
      throw `invalid order type ${ordertype}`
    }

    const [signer] = await hre.ethers.getSigners()
    const tx = await signer.sendTransaction({
      to: lighterConfig.Router,
      data: data,
    })

    await printCreateOrderExecution(tx, orderBookConfig, hre)
  })

async function printCancelOrderExecution(
  tx: ContractTransaction,
  orderBookConfig: OrderBookConfig,
  hre: HardhatRuntimeEnvironment
) {
  await tx.wait()

  const allEvents = await getAllLighterEvents(tx.hash, hre)
  let cancelOrderEvent: CancelLimitOrderEvent | null = null
  for (const event of allEvents) {
    if (event.eventName == LighterEventType.CANCEL_LIMIT_ORDER_EVENT) {
      cancelOrderEvent = event as CancelLimitOrderEvent
    }
  }

  if (cancelOrderEvent == null) {
    console.warn(`order already canceled or not active`)
    return
  }

  console.log(`cancelOrder Transaction: ${tx.hash} successful\norderId:${cancelOrderEvent.id}`)
}

task('cancelOrder')
  .addParam('orderbookname')
  .addParam('id')
  .setDescription('cancel Limit Order')
  .setAction(async ({orderbookname, id}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
    if (!orderBookAddress) {
      throw new Error(`Invalid order book '${orderbookname}'`)
    }
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)

    const txData = getCancelLimitOrderFallbackData(orderBookConfig.orderBookId, [id])

    const [signer] = await hre.ethers.getSigners()
    const tx = await signer.sendTransaction({
      to: lighterConfig.Router,
      data: txData,
    })

    await printCancelOrderExecution(tx, orderBookConfig, hre)
  })
