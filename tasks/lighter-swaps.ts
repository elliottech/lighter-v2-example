import {task} from 'hardhat/config'
import {boolean, string} from 'hardhat/internal/core/params/argumentTypes'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {ContractTransaction} from 'ethers'
import {formatUnits} from 'ethers/lib/utils'
import {parseAmount} from './utils'
import {
  LighterEventType,
  OrderBookConfig,
  OrderBookKey,
  SwapExactAmountEvent,
  getAllLighterEvents,
  getLighterConfig,
  getOrderBookConfigFromAddress,
  getSwapExactInputSingleFallbackData,
  getSwapExactOutputSingleFallbackData,
} from '../sdk'

async function printSwapExactExecution(
  tx: ContractTransaction,
  orderBookConfig: OrderBookConfig,
  hre: HardhatRuntimeEnvironment
) {
  await tx.wait()

  const allEvents = await getAllLighterEvents(tx.hash, hre)
  let swapExactEvent: SwapExactAmountEvent | null = null
  for (const event of allEvents) {
    if (event.eventName == LighterEventType.SWAP_EXACT_AMOUNT_EVENT) {
      swapExactEvent = event as SwapExactAmountEvent
    }
  }

  if (swapExactEvent == null) {
    console.warn(`no swap event was triggered but transaction was successful`)
    return
  }

  const swapped0 = formatUnits(swapExactEvent.swapAmount0, orderBookConfig.token0Precision)
  const swapped1 = formatUnits(swapExactEvent.swapAmount1, orderBookConfig.token1Precision)

  const swappedToken0 = swapExactEvent.isAsk

  console.log(
    `swapExact Transaction: ${tx.hash} successful\n` +
      `swapped ${swappedToken0 ? swapped0 : swapped1} ${
        swappedToken0 ? orderBookConfig.token0Symbol : orderBookConfig.token1Symbol
      } ` +
      `for ${swappedToken0 ? swapped1 : swapped0} ${
        swappedToken0 ? orderBookConfig.token1Symbol : orderBookConfig.token0Symbol
      }`
  )
}

task('swapExactInput')
  .addParam('orderbookname')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .addParam('exactinput')
  .addParam('minoutput', 'min amount to be received', '0', string)
  .addParam('recipient', 'recipient of the tokens', '', string)
  .addParam('unwrap', 'unwrap received token (only available if output token is WETH)', false, boolean)
  .setDescription('perform swapExactInputSingle via Router')
  .setAction(async ({orderbookname, isask, exactinput, minoutput, recipient, unwrap}, hre) => {
    const [signer] = await hre.ethers.getSigners()
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
    if (!orderBookAddress) {
      throw new Error(`Invalid order book '${orderbookname}'`)
    }
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
    const exactInputAmount = parseAmount(
      exactinput,
      isask ? orderBookConfig.token0Precision : orderBookConfig.token1Precision
    )
    const minOutputAmount = parseAmount(
      minoutput,
      isask ? orderBookConfig.token1Precision : orderBookConfig.token0Precision
    )
    if (recipient == '') {
      recipient = signer.address
    }

    if (exactInputAmount.eq(0)) {
      throw 'exact input is 0'
    }

    const tx = await signer.sendTransaction({
      to: lighterConfig.Router,
      data: getSwapExactInputSingleFallbackData(
        orderBookConfig.orderBookId,
        isask,
        exactInputAmount,
        minOutputAmount,
        recipient,
        unwrap,
        signer.address
      ),
    })

    await printSwapExactExecution(tx, orderBookConfig, hre)
  })

task('swapExactOutput')
  .addParam('orderbookname')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .addParam('exactoutput')
  .addParam('maxinput', 'max input amount paid', '10000', string)
  .addParam('recipient', 'recipient of the tokens', '', string)
  .addParam('unwrap', 'unwrap received token (only available if output token is WETH)', false, boolean)
  .setDescription('perform swapExactOutputSingle via Router')
  .setAction(async ({orderbookname, isask, exactoutput, maxinput, recipient, unwrap}, hre) => {
    const [signer] = await hre.ethers.getSigners()
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
    if (!orderBookAddress) {
      throw new Error(`Invalid order book '${orderbookname}'`)
    }
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
    const exactOutputAmount = parseAmount(
      exactoutput,
      isask ? orderBookConfig.token1Precision : orderBookConfig.token0Precision
    )
    const maxInputAmount = parseAmount(
      maxinput,
      isask ? orderBookConfig.token0Precision : orderBookConfig.token1Precision
    )
    if (recipient == '') {
      recipient = signer.address
    }

    if (exactOutputAmount.eq(0)) {
      throw 'exact output is 0'
    }

    const tx = await signer.sendTransaction({
      to: lighterConfig.Router,
      data: getSwapExactOutputSingleFallbackData(
        orderBookConfig.orderBookId,
        isask,
        exactOutputAmount,
        maxInputAmount,
        recipient,
        unwrap,
        signer.address
      ),
    })

    await printSwapExactExecution(tx, orderBookConfig, hre)
  })
