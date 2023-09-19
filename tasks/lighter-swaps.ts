import {task} from 'hardhat/config'
import {boolean} from 'hardhat/internal/core/params/argumentTypes'
import {BigNumber} from 'ethers'
import {OrderBookConfig, OrderBookKey, getLighterConfig, parseAmount} from '../config'
import {isSuccessful, getRouterAt} from '../shared'

// WETH-USDC
//exact-input-amount of WETH = 1
//min-output-amount of USDC = 1950
// isAsk = true
// npx hardhat swapExactInputSingle --orderBookName WETH-USDC --isask true --exactInput 0.2 --minOutput 1950 --recipient '' --unwrap false --network arbgoerli
task('swapExactInputSingle')
  .addParam('orderBookName')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .addParam('exactInput')
  .addParam('minOutput')
  .addParam('recipient')
  .addParam('unwrap', 'unwrap can be true or false', null, boolean)
  .setDescription('swapExactInputSingle via Router')
  .setAction(async ({orderBookName, isask, exactInput, minOutput, recipient, unwrap}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
    const orderBookConfig = lighterConfig.OrderBooks[orderBookName as OrderBookKey] as OrderBookConfig
    const exactInputAmount = parseAmount(exactInput, isask, orderBookName as OrderBookKey, orderBookConfig)
    const minOutputAmount = parseAmount(minOutput, isask, orderBookName as OrderBookKey, orderBookConfig)
    const tx = await (
      await routerContract
    ).swapExactInputSingle(orderBookConfig.Id as BigNumber, isask, exactInputAmount, minOutputAmount, recipient, unwrap)
    await tx.wait()
    const successIndicator = await isSuccessful(hre.ethers.provider, tx.hash)

    if (successIndicator) {
      console.log(`swapExactInputSingle Transaction: ${tx.hash} on OrderBook: ${orderBookName} is successful`)
    } else {
      console.log(`swapExactInputSingle Transaction: ${tx.hash} on OrderBook: ${orderBookName} failed`)
    }
  })

// WETH-USDC
//exact-output-amount of USDC = 2000
//max-input-amount of WETH = 1.1
// isAsk = true
// npx hardhat swapExactOutputSingle --orderBookName WETH-USDC --isask true --exactOutput 2000 --maxInput 1.1 --recipient '' --unwrap false --network arbgoerli
task('swapExactOutputSingle')
  .addParam('orderBookName')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .addParam('exactOutput')
  .addParam('maxInput')
  .addParam('recipient')
  .addParam('unwrap', 'unwrap can be true or false', null, boolean)
  .setDescription('swapExactOutputSingle via Router')
  .setAction(async ({orderBookName, isask, exactOutput, maxInput, recipient, unwrap}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
    const orderBookConfig = lighterConfig.OrderBooks[orderBookName as OrderBookKey] as OrderBookConfig
    const exactOutputAmount = parseAmount(exactOutput, isask, orderBookName as OrderBookKey, orderBookConfig)
    const maxInputAmount = parseAmount(maxInput, isask, orderBookName as OrderBookKey, orderBookConfig)
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
      console.log(`swapExactOutputSingle Transaction: ${tx.hash} on OrderBook: ${orderBookName} is successful`)
    } else {
      console.log(`swapExactOutputSingle Transaction: ${tx.hash} on OrderBook: ${orderBookName} failed`)
    }
  })
