import {Provider} from '@ethersproject/providers'
import {BigNumber} from 'ethers'
import {HardhatRuntimeEnvironment} from 'hardhat/types'

export const isSuccessful = async (provider: Provider, transactionHash: string): Promise<boolean> => {
  const txReceipt = await getTransactionReceipt(provider, transactionHash)
  if (txReceipt.status === 1) {
    return true
  } else if (txReceipt.status === 0) {
    return false
  } else {
    throw new Error(`Transaction status is unknown`)
  }
}

export const getTransactionReceipt = async (provider: Provider, transactionHash: string) => {
  const txReceipt = await provider.getTransactionReceipt(transactionHash)

  if (!txReceipt) {
    throw new Error(`Transaction ${transactionHash} is not mined`)
  }

  return txReceipt
}

export const getTransaction = async (provider: Provider, transactionHash: string) => {
  const txnDetails = await provider.getTransaction(transactionHash)

  if (!txnDetails) {
    throw new Error(`Transaction ${transactionHash} not found`)
  }

  return txnDetails
}

export const parseOrderBookIdFromTransactionData = async (
  transactionHash: string,
  hre: HardhatRuntimeEnvironment
): Promise<BigNumber> => {
  // Get transaction details
  const tx = await getTransaction(hre.ethers.provider, transactionHash)

  // Extract input data from the transaction
  const inputData = tx.data

  const orderBookIdHex = inputData.slice(10, 65)
  const orderBookId = parseInt(orderBookIdHex, 16)

  // Take the first 4 bytes (8 characters) as the function selector
  return BigNumber.from(orderBookId)
}
