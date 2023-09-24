import {Provider} from '@ethersproject/providers'
import {LighterAction, lighterFunctionSignatures} from '../config'
import {ethers} from 'ethers'
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

export const getFunctionSelector = async (transactionHash: string, hre: HardhatRuntimeEnvironment): Promise<string> => {
  // Get transaction details
  const tx = await getTransaction(hre.ethers.provider, transactionHash)

  // Extract input data from the transaction
  const inputData = tx.data

  // Take the first 4 bytes (8 characters) as the function selector
  return inputData.slice(0, 10)
}

export const lookupLighterActionFromFunctionSelector = async (
  transactionHash: string,
  hre: HardhatRuntimeEnvironment
): Promise<LighterAction> => {
  const functionSelector = await getFunctionSelector(transactionHash, hre)

  switch (functionSelector) {
    case lighterFunctionSignatures[LighterAction.CREATE_LIMIT_ORDER].functionSelector: {
      return LighterAction.CREATE_LIMIT_ORDER
    }

    case lighterFunctionSignatures[LighterAction.CANCEL_LIMIT_ORDER].functionSelector: {
      return LighterAction.CANCEL_LIMIT_ORDER
    }

    case lighterFunctionSignatures[LighterAction.UPDATE_LIMIT_ORDER].functionSelector: {
      return LighterAction.UPDATE_LIMIT_ORDER
    }

    case lighterFunctionSignatures[LighterAction.CREATE_FOK_ORDER].functionSelector: {
      return LighterAction.CREATE_FOK_ORDER
    }

    case lighterFunctionSignatures[LighterAction.CREATE_IOC_ORDER].functionSelector: {
      return LighterAction.CREATE_IOC_ORDER
    }

    case lighterFunctionSignatures[LighterAction.FLASH_LOAN].functionSelector: {
      return LighterAction.FLASH_LOAN
    }

    case lighterFunctionSignatures[LighterAction.SWAP_EXACT_INPUT_SINGLE].functionSelector: {
      return LighterAction.SWAP_EXACT_INPUT_SINGLE
    }

    case lighterFunctionSignatures[LighterAction.SWAP_EXACT_OUTPUT_SINGLE].functionSelector: {
      return LighterAction.SWAP_EXACT_OUTPUT_SINGLE
    }

    default:
      throw new Error(`Unsupported LighterAction`)
  }
}
