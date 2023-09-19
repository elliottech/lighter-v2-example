import {task} from 'hardhat/config'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {boolean} from 'hardhat/internal/core/params/argumentTypes'
import * as RouterABI from '@elliottech/lighter-v2-periphery/artifacts/contracts/Router.sol/Router.json'
import {BigNumber} from 'ethers'
import {OrderBookConfig, OrderBookKey, getLighterConfig} from '../config'
import {IRouter} from '../typechain-types'
import {ParseWETH, ParseUSDC, isSuccessful} from '../shared'

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
    const amountBase = ParseWETH(amount).div(orderBookConfig.SizeTick as BigNumber)
    const priceBase = ParseUSDC(price).div(orderBookConfig.PriceTick as BigNumber)
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

async function getRouterAt(address: string, hre: HardhatRuntimeEnvironment): Promise<IRouter> {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(RouterABI.abi, address, signer)) as any as IRouter
}
