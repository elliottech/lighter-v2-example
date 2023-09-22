import '@nomiclabs/hardhat-ethers'
import {Provider} from '@ethersproject/providers'
import {getOrderBookAt, getOrderTypeFromValue, getTransactionReceipt} from '../shared'
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
  getLighterEventSignature,
} from '../config'

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

  let eventSignatureData = getLighterEventSignature(lighterEventType)

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
    throw new Error(`Failed to lookup for ${eventSignatureData.eventName}`)
  }

  return decodedEventLogs.map((eventData) => eventSignatureData.parseEventFunction(eventData))
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
