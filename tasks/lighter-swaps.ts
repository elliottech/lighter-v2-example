import {task} from 'hardhat/config'
import {boolean} from 'hardhat/internal/core/params/argumentTypes'
import {OrderBookKey, getLighterConfig} from '../config'
import {isSuccessful, getRouterAt, getSwapExactAmountEvent, parseAmount, getOrderBookConfigFromAddress} from '../shared'

// npx hardhat swapExactInputSingle --orderbookname WETH-USDC --isask false --exactinput 2000 --minoutput 1 --recipient '0xf5306fc60C48E3E2fBf9262D699Cb05C4910e6D9' --unwrap false --network arbgoerli
task('swapExactInputSingle')
  .addParam('orderbookname')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .addParam('exactinput')
  .addParam('minoutput')
  .addParam('recipient')
  .addParam('unwrap', 'unwrap can be true or false', null, boolean)
  .setDescription('swapExactInputSingle via Router')
  .setAction(async ({orderbookname, isask, exactinput, minoutput, recipient, unwrap}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
    const exactInputAmount = parseAmount(
      exactinput,
      isask ? orderBookConfig.token0Precision : orderBookConfig.token1Precision
    )
    const minOutputAmount = parseAmount(
      minoutput,
      isask ? orderBookConfig.token1Precision : orderBookConfig.token0Precision
    )
    const tx = await (
      await routerContract
    ).swapExactInputSingle(orderBookConfig.orderBookId, isask, exactInputAmount, minOutputAmount, recipient, unwrap)
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      const swapExactAmountEvents = await getSwapExactAmountEvent(orderBookAddress, tx.hash, hre)

      console.log(
        `swapExactInputSingle Transaction: ${
          tx.hash
        } is successful on OrderBook: ${orderbookname} and SwapExactAmount: ${JSON.stringify(
          swapExactAmountEvents,
          null,
          2
        )} emitted`
      )
    } else {
      console.log(`swapExactInputSingle Transaction: ${tx.hash} on OrderBook: ${orderbookname} failed`)
    }
  })

// npx hardhat swapExactOutputSingle --orderbookname WETH-USDC --isask false --exactoutput 1 --maxinput 2010 --recipient '0xf5306fc60C48E3E2fBf9262D699Cb05C4910e6D9' --unwrap false --network arbgoerli
task('swapExactOutputSingle')
  .addParam('orderbookname')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .addParam('exactoutput')
  .addParam('maxinput')
  .addParam('recipient')
  .addParam('unwrap', 'unwrap can be true or false', null, boolean)
  .setDescription('swapExactOutputSingle via Router')
  .setAction(async ({orderbookname, isask, exactoutput, maxinput, recipient, unwrap}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
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
    const tx = await (
      await routerContract
    ).swapExactOutputSingle(orderBookConfig.orderBookId, isask, exactOutputAmount, maxInputAmount, recipient, unwrap)
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      const swapExactAmountEvents = await getSwapExactAmountEvent(orderBookAddress, tx.hash, hre)

      console.log(
        `swapExactOutputSingle Transaction: ${
          tx.hash
        } is successful on OrderBook: ${orderbookname} and SwapExactAmount: ${JSON.stringify(
          swapExactAmountEvents,
          null,
          2
        )} emitted`
      )
    } else {
      console.log(`swapExactOutputSingle Transaction: ${tx.hash} on OrderBook: ${orderbookname} failed`)
    }
  })
