import {Provider} from '@ethersproject/providers'
import * as RouterABI from '@elliottech/lighter-v2-periphery/artifacts/contracts/Router.sol/Router.json'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {IRouter} from '../typechain-types'

export const isSuccessful = async (provider: Provider, transactionHash: string): Promise<boolean> => {
  const txReceipt = await provider.getTransactionReceipt(transactionHash)
  if (txReceipt) {
    if (txReceipt.status === 1) {
      return true
    } else if (txReceipt.status === 0) {
      return false
    } else {
      throw new Error(`Transaction status is unknown`)
    }
  } else {
    throw new Error(`Transaction is not mined`)
  }
}

export const getRouterAt = async (address: string, hre: HardhatRuntimeEnvironment): Promise<IRouter> => {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(RouterABI.abi, address, signer)) as any as IRouter
}
