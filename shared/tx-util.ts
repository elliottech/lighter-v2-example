import {Provider} from '@ethersproject/providers'

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
