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
  lighterEventSignatures,
  LighterEvent,
  CREATE_ORDER_EVENT_NAME,
  CLAIMABLE_BALANCE_INCREASE_EVENT,
  CANCEL_LIMIT_ORDER_EVENT_NAME,
  CLAIMABLE_BALANCE_DECREASE_EVENT,
  FLASH_LOAN_EVENT_NAME,
  SWAP_EVENT_NAME,
  SWAP_EXACT_AMOUNT_EVENT_NAME,
} from '../config'

export const getAllLighterEvents = async (
  orderBookAddress: string,
  transactionHash: string,
  hre: any
): Promise<LighterEvent[]> => {
  const events = []

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

  const flashLoanEvents = await getLighterEventsByEventType(
    orderBookAddress,
    transactionHash,
    LighterEventType.FLASH_LOAN_EVENT,
    hre
  )
  if (flashLoanEvents) {
    events.push(...flashLoanEvents)
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
  const swapExactAmountEvents = await getLighterEventsByEventType(
    orderBookAddress,
    transactionHash,
    LighterEventType.SWAP_EXACT_AMOUNT_EVENT,
    hre
  )
  if (swapExactAmountEvents) {
    events.push(...swapExactAmountEvents)
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
    eventName: 'CreateOrderEvent',
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
    eventName: 'CancelLimitOrderEvent',
    id: BigNumber.from(eventData.args[0].toString()),
  }
}

function parseSwapEventData(eventData: ethers.utils.LogDescription): SwapEvent {
  if (!eventData || !eventData.args || eventData.args.length != 6) {
    throw new Error(`Invalid eventData`)
  }

  return {
    eventName: 'SwapEvent',
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
    eventName: 'SwapExactAmountEvent',
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
    eventName: 'FlashLoanEvent',
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
    eventName: 'ClaimableBalanceIncreaseEvent',
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
    eventName: 'ClaimableBalanceDecreaseEvent',
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

export const printLighterEvents = (lighterEvent: LighterEvent): string => {
  switch (lighterEvent.eventName) {
    case CREATE_ORDER_EVENT_NAME:
      return createOrderEventToString(lighterEvent as CreateOrderEvent)

    case CANCEL_LIMIT_ORDER_EVENT_NAME:
      return cancelLimitOrderEventToString(lighterEvent as CancelLimitOrderEvent)

    case SWAP_EVENT_NAME:
      return swapEventToString(lighterEvent as SwapEvent)

    case SWAP_EXACT_AMOUNT_EVENT_NAME:
      return swapExactAmountEventToString(lighterEvent as SwapExactAmountEvent)

    case FLASH_LOAN_EVENT_NAME:
      return flashLoanEventToString(lighterEvent as FlashLoanEvent)

    case CLAIMABLE_BALANCE_INCREASE_EVENT:
      return claimableBalanceIncreaseEventToString(lighterEvent as ClaimableBalanceIncreaseEvent)

    case CLAIMABLE_BALANCE_DECREASE_EVENT:
      return claimableBalanceDecreaseEventToString(lighterEvent as ClaimableBalanceDecreaseEvent)

    default:
      return ''
  }
}

// Implement a utility function to convert BigNumber properties to strings
function createOrderEventToString(event: CreateOrderEvent): string {
  return `\n{
    eventName: ${event.eventName},
    owner: ${event.owner},
    id: ${event.id.toString()},
    amount0Base: ${event.amount0Base.toString()},
    priceBase: ${event.priceBase.toString()},
    isAsk: ${event.isAsk},
    orderType: ${event.orderType}
  }\n`
}

// Implement custom toString functions for each event type
function cancelLimitOrderEventToString(event: CancelLimitOrderEvent): string {
  return `\n{
    eventName: ${event.eventName},
    id: ${event.id.toString()}
  }\n`
}

function swapEventToString(event: SwapEvent): string {
  return `\n{
    eventName: ${event.eventName},
    askId: ${event.askId.toString()},
    bidId: ${event.bidId.toString()},
    askOwner: ${event.askOwner},
    bidOwner: ${event.bidOwner},
    amount0: ${event.amount0.toString()},
    amount1: ${event.amount1.toString()}
  }\n`
}

function swapExactAmountEventToString(event: SwapExactAmountEvent): string {
  return `\n{
    eventName: ${event.eventName},
    sender: ${event.sender},
    recipient: ${event.recipient},
    isExactInput: ${event.isExactInput},
    isAsk: ${event.isAsk},
    swapAmount0: ${event.swapAmount0.toString()},
    swapAmount1: ${event.swapAmount1.toString()}
  }\n`
}

// Implement custom toString functions for each event type
function flashLoanEventToString(event: FlashLoanEvent): string {
  return `\n{
    eventName: ${event.eventName},
    sender: ${event.sender},
    recipient: ${event.recipient},
    amount0: ${event.amount0.toString()},
    amount1: ${event.amount1.toString()}
  }\n`
}

function claimableBalanceIncreaseEventToString(event: ClaimableBalanceIncreaseEvent): string {
  return `\n{
    eventName: ${event.eventName},
    owner: ${event.owner},
    amountDelta: ${event.amountDelta.toString()},
    isToken0: ${event.isToken0}
  }\n`
}

function claimableBalanceDecreaseEventToString(event: ClaimableBalanceDecreaseEvent): string {
  return `\n{
    eventName: ${event.eventName},
    owner: ${event.owner},
    amountDelta: ${event.amountDelta.toString()},
    isToken0: ${event.isToken0}
  }\n`
}
