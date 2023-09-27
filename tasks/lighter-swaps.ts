import {task} from 'hardhat/config'
import {boolean, string} from 'hardhat/internal/core/params/argumentTypes'
import {
  OrderBookKey,
  getLighterConfig,
  SwapExactAmountEvent,
  OrderBookConfig,
  SWAP_EXACT_AMOUNT_EVENT_NAME,
} from '../config'
import {isSuccessful, getRouterAt, parseAmount, getOrderBookConfigFromAddress, getAllLighterEvents} from '../shared'
import {formatUnits} from 'ethers/lib/utils'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {ContractTransaction} from 'ethers'

async function printSwapExactExecution(
  tx: ContractTransaction,
  orderBookConfig: OrderBookConfig,
  hre: HardhatRuntimeEnvironment
) {
  await tx.wait()
  const successful = await isSuccessful(hre.ethers.provider, tx.hash)

  if (!successful) {
    console.log(`swapExact Transaction: ${tx.hash} failed`)
    return
  }

  const allEvents = await getAllLighterEvents(tx.hash, hre)
  let swapExactEvent: SwapExactAmountEvent | null = null
  for (const event of allEvents) {
    if (event.eventName == SWAP_EXACT_AMOUNT_EVENT_NAME) {
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
    const routerContract = await getRouterAt(lighterConfig.Router, hre)
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
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

    // TODO: consider using fallback compression here instead of calling swapExact method directly
    const tx = await routerContract.swapExactInputSingle(
      orderBookConfig.orderBookId,
      isask,
      exactInputAmount,
      minOutputAmount,
      recipient,
      unwrap
    )

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
    const routerContract = await getRouterAt(lighterConfig.Router, hre)
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
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

    // TODO: consider using fallback compression here instead of calling swapExact method directly
    const tx = await routerContract.swapExactOutputSingle(
      orderBookConfig.orderBookId,
      isask,
      exactOutputAmount,
      maxInputAmount,
      recipient,
      unwrap
    )
    await printSwapExactExecution(tx, orderBookConfig, hre)
  })
