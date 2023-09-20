import {task} from 'hardhat/config'
import {boolean} from 'hardhat/internal/core/params/argumentTypes'
import {BigNumber} from 'ethers'
import {OrderBookConfig, OrderBookKey, getLighterConfig} from '../config'
import {isSuccessful, getRouterAt, getSwapExactAmountEvent, getTokenPrecisions, parseAmount} from '../shared'

// WETH-USDC
//exact-input-amount of WETH = 1
//min-output-amount of USDC = 1950
// isAsk = true
// npx hardhat swapExactInputSingle --orderBookName WETH-USDC --isask true --exactInput 0.2 --minOutput 1950 --recipient '' --unwrap false --network arbgoerli
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
    const orderBookConfig = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as OrderBookConfig
    const tokenPrecisions = await getTokenPrecisions(orderBookConfig.Address, hre)
    const exactInputAmount = parseAmount(
      exactinput,
      isask ? tokenPrecisions.token0Precision : tokenPrecisions.token1Precision
    )
    const minOutputAmount = parseAmount(
      minoutput,
      isask ? tokenPrecisions.token1Precision : tokenPrecisions.token0Precision
    )
    const tx = await (
      await routerContract
    ).swapExactInputSingle(orderBookConfig.Id as BigNumber, isask, exactInputAmount, minOutputAmount, recipient, unwrap)
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      const swapExactAmountEvent = await getSwapExactAmountEvent(
        hre.ethers.provider,
        orderBookConfig.Address,
        tx.hash,
        hre
      )

      console.log(
        `swapExactInputSingle Transaction: ${
          tx.hash
        } is successful on OrderBook: ${orderbookname} and SwapExactAmount: ${JSON.stringify(
          swapExactAmountEvent,
          null,
          2
        )} emitted`
      )
    } else {
      console.log(`swapExactInputSingle Transaction: ${tx.hash} on OrderBook: ${orderbookname} failed`)
    }
  })

// WETH-USDC
//exact-output-amount of USDC = 2000
//max-input-amount of WETH = 1.1
// isAsk = true
// npx hardhat swapExactOutputSingle --orderBookName WETH-USDC --isask true --exactOutput 2000 --maxInput 1.1 --recipient '' --unwrap false --network arbgoerli
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
    const orderBookConfig = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as OrderBookConfig
    const tokenPrecisions = await getTokenPrecisions(orderBookConfig.Address, hre)
    const exactOutputAmount = parseAmount(
      exactoutput,
      isask ? tokenPrecisions.token1Precision : tokenPrecisions.token0Precision
    )
    const maxInputAmount = parseAmount(
      maxinput,
      isask ? tokenPrecisions.token0Precision : tokenPrecisions.token1Precision
    )
    const tx = await (
      await routerContract
    ).swapExactOutputSingle(
      orderBookConfig.Id as BigNumber,
      isask,
      exactOutputAmount,
      maxInputAmount,
      recipient,
      unwrap
    )
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      const swapExactAmountEvent = await getSwapExactAmountEvent(
        hre.ethers.provider,
        orderBookConfig.Address,
        tx.hash,
        hre
      )

      console.log(
        `swapExactOutputSingle Transaction: ${
          tx.hash
        } is successful on OrderBook: ${orderbookname} and SwapExactAmount: ${JSON.stringify(
          swapExactAmountEvent,
          null,
          2
        )} emitted`
      )
    } else {
      console.log(`swapExactOutputSingle Transaction: ${tx.hash} on OrderBook: ${orderbookname} failed`)
    }
  })
