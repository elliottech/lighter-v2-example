import {task} from 'hardhat/config'
import {boolean, int} from 'hardhat/internal/core/params/argumentTypes'
import {BigNumber, ContractTransaction} from 'ethers'
import {OrderBookKey, getLighterConfig, OrderBookConfig, CreateOrderEvent, SwapEvent} from '../config'
import {
  isSuccessful,
  parseToAmountBase,
  parseToPriceBase,
  getOrderBookConfigFromAddress,
  getAllLighterEvents,
  getOrderFallbackData,
} from '../shared'
import {OrderType} from '../config'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {formatUnits} from 'ethers/lib/utils'

async function printCreateOrderExecution(
  tx: ContractTransaction,
  orderBookConfig: OrderBookConfig,
  hre: HardhatRuntimeEnvironment
) {
  await tx.wait()
  const successful = await isSuccessful(hre.ethers.provider, tx.hash)

  if (!successful) {
    console.log(`createOrder Transaction: ${tx.hash} failed`)
    return
  }

  const allEvents = await getAllLighterEvents(tx.hash, hre)
  let createOrderEvent: CreateOrderEvent | null = null
  let swapEvents: SwapEvent[] = []
  for (const event of allEvents) {
    if (event.eventName == 'CreateOrderEvent') {
      createOrderEvent = event as CreateOrderEvent
    }
    if (event.eventName == 'SwapEvent') {
      swapEvents.push(event as SwapEvent)
    }
  }

  if (createOrderEvent == null) {
    console.warn(`no swap event was triggered but transaction was successful`)
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
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)

    const amountBase = parseToAmountBase(amountStr, orderBookConfig)
    const priceBase = parseToPriceBase(priceStr, orderBookConfig)

    const txData = getOrderFallbackData(
      orderBookConfig.orderBookId,
      ordertype as OrderType,
      amountBase,
      priceBase,
      isask
    )

    const [signer] = await hre.ethers.getSigners()
    const tx = await signer.sendTransaction({
      to: lighterConfig.Router,
      data: txData,
    })

    await printCreateOrderExecution(tx, orderBookConfig, hre)
  })
