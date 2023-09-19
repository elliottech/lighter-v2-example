import {task} from 'hardhat/config'
import {formatUnits, parseUnits} from 'ethers/lib/utils'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {boolean} from 'hardhat/internal/core/params/argumentTypes'
import * as RouterABI from '@elliottech/lighter-v2-periphery/artifacts/contracts/Router.sol/Router.json'
import {BigNumber} from 'ethers'
import {OrderBookKey, getLighterConfig} from '../config'
import {IRouter} from '../typechain-types'

task('createFillOrKillOrder')
  .addParam('orderBookName')
  .addParam('amount')
  .addParam('price')
  .addParam('isask', 'whatever or not order is ask', null, boolean)
  .setDescription('create FillOrKill Order via Router')
  .setAction(async ({orderBookName, amount, price, isAsk}, hre) => {
    const lighterConfig = await getLighterConfig()
    const routerContract = getRouterAt(lighterConfig.Router, hre)
    const orderBookId = lighterConfig.OrderBooks[orderBookName as OrderBookKey]?.Id as BigNumber
    const amountBase = BigNumber.from(amount)
    const priceBase = BigNumber.from(price)
    const tx = await (await routerContract).createFoKOrder(orderBookId, amountBase, priceBase, isAsk)
    await tx.wait()
  })

async function getRouterAt(address: string, hre: HardhatRuntimeEnvironment): Promise<IRouter> {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(RouterABI.abi, address, signer)) as any as IRouter
}
