import {Provider} from '@ethersproject/providers'
import {ethers} from 'ethers'

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

export const getRevertReason = async (
  transactionReceipt: ethers.providers.TransactionReceipt,
  provider: Provider
): Promise<string> => {
  const errorFunctionSignature = 'LighterV2Swap_NotEnoughOutput()'
  const errorFunctionSelector = ethers.utils.id(errorFunctionSignature).substring(0, 10) // Take the first 8 characters (4 bytes)
  console.log(`errorFunctionSelector is: ${errorFunctionSelector}`)
  // The transaction reverted, and you can access the revert reason/message
  const reason = await provider.call({
    to: transactionReceipt.contractAddress,
    data: errorFunctionSelector, // Use the selector here
  })

  const revertReason = ethers.utils.toUtf8String('0x' + reason.slice(138))
  console.error('Transaction reverted with reason:', revertReason)

  return revertReason
}
