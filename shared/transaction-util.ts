import {Provider} from '@ethersproject/providers'

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
