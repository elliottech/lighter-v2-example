import '@nomiclabs/hardhat-ethers'
import {Provider} from '@ethersproject/providers'
import {
  getOrderBookAt,
  getOrderTypeFromValue,
  getTransactionReceipt,
  lookupLighterActionFromFunctionSelector,
} from '../shared'
import {BigNumber, ethers} from 'ethers'
import {
  LighterEventType,
  CreateOrderEvent,
  CancelLimitOrderEvent,
  SwapEvent,
  FlashLoanEvent,
  SwapExactAmountEvent,
  ClaimableBalanceIncreaseEvent,
  ClaimableBalanceDecreaseEvent,
  lighterEventSignatures,
  LighterEventWrapper,
  LighterAction,
  LighterEvent,
} from '../config'

export const getAllLighterEvents = async (
  orderBookAddress: string,
  transactionHash: string,
  hre: any
): Promise<LighterEvent[]> => {
  //evaluate lighterAction from the function-selector of transaction
  const lighterAction: LighterAction = await lookupLighterActionFromFunctionSelector(transactionHash, hre)

  const events = []

  //pull all essential events from the transaction
  switch (lighterAction) {
    case LighterAction.CREATE_LIMIT_ORDER:
    case LighterAction.CREATE_IOC_ORDER:
    case LighterAction.CREATE_FOK_ORDER:
    case LighterAction.CREATE_LIMIT_ORDER_BATCH: {
      const createOrderEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.CREATE_ORDER_EVENT,
        hre
      )

      if (createOrderEvents) {
        events.push(...createOrderEvents)
      }

      const swapEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.SWAP_EVENT,
        hre
      )

      if (swapEvents) {
        events.push(...swapEvents)
      }

      break
    }

    case LighterAction.CANCEL_LIMIT_ORDER:
    case LighterAction.CANCEL_LIMIT_ORDER_BATCH: {
      const cancelLimitOrderEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.CANCEL_LIMIT_ORDER_EVENT,
        hre
      )
      if (cancelLimitOrderEvents) {
        events.push(...cancelLimitOrderEvents)
      }

      break
    }

    case LighterAction.UPDATE_LIMIT_ORDER:
    case LighterAction.UPDATE_LIMIT_ORDER_BATCH: {
      const cancelLimitOrderEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.CANCEL_LIMIT_ORDER_EVENT,
        hre
      )
      if (cancelLimitOrderEvents) {
        events.push(...cancelLimitOrderEvents)
      }

      const createOrderEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.CREATE_ORDER_EVENT,
        hre
      )
      if (createOrderEvents) {
        events.push(...createOrderEvents)
      }
      const swapEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.SWAP_EVENT,
        hre
      )
      if (swapEvents) {
        events.push(...swapEvents)
      }

      break
    }

    case LighterAction.FLASH_LOAN: {
      const flashLoanEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.FLASH_LOAN_EVENT,
        hre
      )
      if (flashLoanEvents) {
        events.push(...flashLoanEvents)
      }

      break
    }

    case LighterAction.SWAP_EXACT_INPUT_SINGLE:
    case LighterAction.SWAP_EXACT_OUTPUT_SINGLE: {
      const swapEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.SWAP_EVENT,
        hre
      )
      if (swapEvents) {
        events.push(...swapEvents)
      }
      const swapExactAmountEvents = await getLighterEventsByEventType(
        orderBookAddress,
        transactionHash,
        LighterEventType.SWAP_EXACT_AMOUNT_EVENT,
        hre
      )
      if (swapExactAmountEvents) {
        events.push(...swapExactAmountEvents)
      }

      break
    }

    default:
      throw new Error(`Unsupported lighterAction: ${lighterAction}`)
  }

  return events
}

export const getLighterEventsByEventType = async (
  orderBookAddress: string,
  transactionHash: string,
  lighterEventType: LighterEventType,
  hre: any
): Promise<
  | CreateOrderEvent[]
  | CancelLimitOrderEvent[]
  | SwapEvent[]
  | SwapExactAmountEvent[]
  | FlashLoanEvent[]
  | ClaimableBalanceIncreaseEvent[]
  | ClaimableBalanceDecreaseEvent[]
> => {
  if (!orderBookAddress) {
    throw new Error(`Invalid orderBookAddress`)
  }

  if (!transactionHash) {
    throw new Error(`Invalid transactionHash`)
  }

  const provider: Provider = hre.ethers.provider

  if (!provider || !provider._isProvider) {
    throw new Error(`Invalid provider`)
  }

  const orderbookContract = await getOrderBookAt(orderBookAddress, hre)

  if (!orderbookContract) {
    throw new Error(`Failed to load orderBookContract Instance for: ${orderBookAddress}`)
  }

  let eventSignatureData = lighterEventSignatures[lighterEventType]

  let eventInterfaceBlock =
    orderbookContract.interface.events[
      eventSignatureData.eventSignature as keyof typeof orderbookContract.interface.events
    ]

  // Check if the contract ABI includes the event interface
  if (!eventInterfaceBlock) {
    throw new Error(`Event ${eventSignatureData.eventSignature} not found in Orderbook-contract ABI.`)
  }

  const txReceipt = await getTransactionReceipt(provider, transactionHash)

  if (!txReceipt) {
    throw new Error(`Invalid transactionReceipt for hash: ${transactionHash}`)
  }

  if (!txReceipt.logs || txReceipt.logs.length == 0) {
    console.log(`transactionReceipt has invalid or empty logs`)
  }

  // Define the event interface with the full event structure
  let eventInterface = new ethers.utils.Interface([eventInterfaceBlock])

  // Filter the logs for the event
  const decodedEventLogs = txReceipt.logs
    .filter((log) => log.topics[0] === eventInterface.getEventTopic(eventSignatureData.eventName))
    .map((log) => eventInterface.parseLog(log))

  if (!decodedEventLogs || decodedEventLogs.length == 0 || !decodedEventLogs[0]) {
    console.warn(`No ${eventSignatureData.eventName}s for transactionHash: ${transactionHash}`)
  }

  return decodedEventLogs && decodedEventLogs.length > 0
    ? decodedEventLogs.map((eventData) => eventSignatureData.parseEventFunction(eventData))
    : []
}

export const parseCreateOrderEventData = (eventData: ethers.utils.LogDescription): CreateOrderEvent => {
  if (!eventData || !eventData.args || eventData.args.length != 6) {
    throw new Error(`Invalid eventData`)
  }

  return {
    owner: eventData.args[0].toString(),
    id: BigNumber.from(eventData.args[1].toString()),
    amount0Base: BigNumber.from(eventData.args[2].toString()),
    priceBase: BigNumber.from(eventData.args[3].toString()),
    isAsk: eventData.args[4],
    orderType: getOrderTypeFromValue(parseInt(eventData.args[5])),
  }
}

function parseCancelLimitOrderEventData(eventData: ethers.utils.LogDescription): CancelLimitOrderEvent {
  if (!eventData || !eventData.args || eventData.args.length != 1) {
    throw new Error(`Invalid eventData`)
  }

  return {
    id: BigNumber.from(eventData.args[0].toString()),
  }
}

function parseSwapEventData(eventData: ethers.utils.LogDescription): SwapEvent {
  if (!eventData || !eventData.args || eventData.args.length != 6) {
    throw new Error(`Invalid eventData`)
  }

  return {
    askId: BigNumber.from(eventData.args[0].toString()),
    bidId: BigNumber.from(eventData.args[1].toString()),
    askOwner: eventData.args[2].toString(),
    bidOwner: eventData.args[3].toString(),
    amount0: BigNumber.from(eventData.args[4].toString()),
    amount1: BigNumber.from(eventData.args[5].toString()),
  }
}

export const parseSwapExactAmountEventData = (eventData: ethers.utils.LogDescription): SwapExactAmountEvent => {
  return {
    sender: eventData.args[0].toString(),
    recipient: eventData.args[1].toString(),
    isExactInput: eventData.args[2].toString(),
    isAsk: eventData.args[3].toString(),
    swapAmount0: BigNumber.from(eventData.args[4]),
    swapAmount1: BigNumber.from(eventData.args[5]),
  }
}

export const parseFlashLoanEventData = (eventData: ethers.utils.LogDescription): FlashLoanEvent => {
  if (!eventData || !eventData.args || eventData.args.length != 4) {
    throw new Error(`Invalid eventData`)
  }

  return {
    sender: eventData.args[0].toString(),
    recipient: eventData.args[1].toString(),
    amount0: BigNumber.from(eventData.args[2]),
    amount1: BigNumber.from(eventData.args[3]),
  }
}

export const parseClaimableBalanceIncreaseEventData = (
  eventData: ethers.utils.LogDescription
): ClaimableBalanceIncreaseEvent => {
  if (!eventData || !eventData.args || eventData.args.length != 3) {
    throw new Error(`Invalid eventData`)
  }

  return {
    owner: eventData.args[0].toString(),
    amountDelta: BigNumber.from(eventData.args[1].toString()),
    isToken0: eventData.args[2].toString(),
  }
}

export const parseClaimableBalanceDecreaseEventData = (
  eventData: ethers.utils.LogDescription
): ClaimableBalanceDecreaseEvent => {
  if (!eventData || !eventData.args || eventData.args.length != 3) {
    throw new Error(`Invalid eventData`)
  }

  return {
    owner: eventData.args[0].toString(),
    amountDelta: BigNumber.from(eventData.args[1].toString()),
    isToken0: eventData.args[2].toString(),
  }
}

// Define the parsing functions in the parseFunctions object
export const ParseEventFunctions = {
  parseCreateOrderEventData,
  parseCancelLimitOrderEventData,
  parseSwapEventData,
  parseSwapExactAmountEventData,
  parseFlashLoanEventData,
  parseClaimableBalanceIncreaseEventData,
  parseClaimableBalanceDecreaseEventData,
}
