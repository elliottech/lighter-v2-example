import {Provider} from '@ethersproject/providers'
import {OrderType} from './order'
import {BigNumber, ethers} from 'ethers'
import {EventFragment} from '@ethersproject/abi'

export enum LighterEventType {
  CREATE_ORDER_EVENT = 'CreateOrder',
  CANCEL_LIMIT_ORDER_EVENT = 'CancelLimitOrder',
  SWAP_EVENT = 'Swap',
  SWAP_EXACT_AMOUNT_EVENT = 'SwapExactAmount',
  FLASH_LOAN_EVENT = 'FlashLoan',
  CLAIMABLE_BALANCE_INCREASE_EVENT = 'ClaimableBalanceIncrease',
  CLAIMABLE_BALANCE_DECREASE_EVENT = 'ClaimableBalanceDecrease',
}

export const allLighterEvents: LighterEventType[] = [
  LighterEventType.CREATE_ORDER_EVENT,
  LighterEventType.CANCEL_LIMIT_ORDER_EVENT,
  LighterEventType.SWAP_EVENT,
  LighterEventType.SWAP_EXACT_AMOUNT_EVENT,
  LighterEventType.FLASH_LOAN_EVENT,
  LighterEventType.CLAIMABLE_BALANCE_DECREASE_EVENT,
  LighterEventType.CLAIMABLE_BALANCE_INCREASE_EVENT,
]

export const lighterEventSignatures: Record<LighterEventType, string> = {
  [LighterEventType.CREATE_ORDER_EVENT]: 'CreateOrder(address,uint32,uint64,uint64,bool,uint8)',
  [LighterEventType.CANCEL_LIMIT_ORDER_EVENT]: 'CancelLimitOrder(uint32)',
  [LighterEventType.SWAP_EVENT]: 'Swap(uint32,uint32,address,address,uint256,uint256)',
  [LighterEventType.SWAP_EXACT_AMOUNT_EVENT]: 'SwapExactAmount(address,address,bool,bool,uint256,uint256)',
  [LighterEventType.FLASH_LOAN_EVENT]: 'FlashLoan(address,address,uint256,uint256)',
  [LighterEventType.CLAIMABLE_BALANCE_INCREASE_EVENT]: 'ClaimableBalanceIncrease(address,uint256,bool)',
  [LighterEventType.CLAIMABLE_BALANCE_DECREASE_EVENT]: 'ClaimableBalanceDecrease(address,uint256,bool)',
}

export interface CreateOrderEvent {
  eventName: string
  owner: string
  id: BigNumber
  amount0Base: BigNumber
  priceBase: BigNumber
  isAsk: boolean
  orderType: OrderType
}

export interface SwapEvent {
  eventName: string
  askId: BigNumber
  bidId: BigNumber
  askOwner: string
  bidOwner: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface CancelLimitOrderEvent {
  eventName: string
  id: BigNumber
}

export interface SwapExactAmountEvent {
  eventName: string
  sender: string
  recipient: string
  isExactInput: boolean
  isAsk: boolean
  swapAmount0: BigNumber
  swapAmount1: BigNumber
}

export interface FlashLoanEvent {
  eventName: string
  sender: string
  recipient: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface ClaimableBalanceIncreaseEvent {
  eventName: string
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}

export interface ClaimableBalanceDecreaseEvent {
  eventName: string
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}

export type LighterEvent =
  | CreateOrderEvent
  | CancelLimitOrderEvent
  | SwapEvent
  | SwapExactAmountEvent
  | FlashLoanEvent
  | ClaimableBalanceIncreaseEvent
  | ClaimableBalanceDecreaseEvent

// === Parse Events from transaction ===

export const getAllLighterEvents = async (transactionHash: string, hre: any): Promise<LighterEvent[]> => {
  if (!transactionHash) {
    throw new Error(`Invalid transactionHash`)
  }

  const provider: Provider = hre.ethers.provider
  if (!provider || !provider._isProvider) {
    throw new Error(`Invalid provider`)
  }

  // fetch receipt & all logs
  const txReceipt = await provider.getTransactionReceipt(transactionHash)
  if (!txReceipt) {
    throw new Error(`Invalid transactionReceipt; hash: ${transactionHash}`)
  }
  if (txReceipt.status === 0) {
    throw new Error(`Transaction failed; hash: ${transactionHash}`)
  }
  if (txReceipt.status !== 1) {
    throw new Error(`Unknown transaction status ${txReceipt.status}; hash: ${transactionHash}`)
  }

  let fragments: EventFragment[] = []
  // avoid typescript error triggered the first time the project is compiled by requiring here instead of having a global import
  const IOrderBook__factory = require('../typechain-types').IOrderBook__factory
  const obInterface = IOrderBook__factory.createInterface()
  for (const event of allLighterEvents) {
    fragments.push(obInterface.events[lighterEventSignatures[event] as keyof typeof obInterface.events])
  }

  // Define the event interface with the full event structure
  let eventInterface = new ethers.utils.Interface(fragments)

  // Filter the logs for the event
  return txReceipt.logs
    .map((log) => {
      for (const event of allLighterEvents) {
        if (log.topics[0] == eventInterface.getEventTopic(event)) {
          const parser = eventsParser[event]
          return parser(eventInterface.parseLog(log))
        }
      }
      return null
    })
    .filter((log): log is LighterEvent => log != null)
}

function parseCreateOrderEventData(eventData: ethers.utils.LogDescription): CreateOrderEvent {
  if (!eventData || !eventData.args || eventData.args.length != 6) {
    throw new Error(`Invalid eventData`)
  }

  return {
    eventName: LighterEventType.CREATE_ORDER_EVENT,
    owner: eventData.args[0].toString(),
    id: BigNumber.from(eventData.args[1].toString()),
    amount0Base: BigNumber.from(eventData.args[2].toString()),
    priceBase: BigNumber.from(eventData.args[3].toString()),
    isAsk: eventData.args[4].toString().toLowerCase() === 'true',
    orderType: parseInt(eventData.args[5]) as OrderType,
  }
}

function parseCancelLimitOrderEventData(eventData: ethers.utils.LogDescription): CancelLimitOrderEvent {
  if (!eventData || !eventData.args || eventData.args.length != 1) {
    throw new Error(`Invalid eventData`)
  }

  return {
    eventName: LighterEventType.CANCEL_LIMIT_ORDER_EVENT,
    id: BigNumber.from(eventData.args[0].toString()),
  }
}

function parseSwapEventData(eventData: ethers.utils.LogDescription): SwapEvent {
  if (!eventData || !eventData.args || eventData.args.length != 6) {
    throw new Error(`Invalid eventData`)
  }

  return {
    eventName: LighterEventType.SWAP_EVENT,
    askId: BigNumber.from(eventData.args[0].toString()),
    bidId: BigNumber.from(eventData.args[1].toString()),
    askOwner: eventData.args[2].toString(),
    bidOwner: eventData.args[3].toString(),
    amount0: BigNumber.from(eventData.args[4].toString()),
    amount1: BigNumber.from(eventData.args[5].toString()),
  }
}

function parseSwapExactAmountEventData(eventData: ethers.utils.LogDescription): SwapExactAmountEvent {
  return {
    eventName: LighterEventType.SWAP_EXACT_AMOUNT_EVENT,
    sender: eventData.args[0].toString(),
    recipient: eventData.args[1].toString(),
    isExactInput: eventData.args[2].toString().toLowerCase() === 'true',
    isAsk: eventData.args[3].toString().toLowerCase() === 'true',
    swapAmount0: BigNumber.from(eventData.args[4]),
    swapAmount1: BigNumber.from(eventData.args[5]),
  }
}

function parseFlashLoanEventData(eventData: ethers.utils.LogDescription): FlashLoanEvent {
  if (!eventData || !eventData.args || eventData.args.length != 4) {
    throw new Error(`Invalid eventData`)
  }

  return {
    eventName: LighterEventType.FLASH_LOAN_EVENT,
    sender: eventData.args[0].toString(),
    recipient: eventData.args[1].toString(),
    amount0: BigNumber.from(eventData.args[2]),
    amount1: BigNumber.from(eventData.args[3]),
  }
}

function parseClaimableBalanceIncreaseEventData(eventData: ethers.utils.LogDescription): ClaimableBalanceIncreaseEvent {
  if (!eventData || !eventData.args || eventData.args.length != 3) {
    throw new Error(`Invalid eventData`)
  }

  return {
    eventName: LighterEventType.CLAIMABLE_BALANCE_INCREASE_EVENT,
    owner: eventData.args[0].toString(),
    amountDelta: BigNumber.from(eventData.args[1].toString()),
    isToken0: eventData.args[2].toString().toLowerCase() === 'true',
  }
}

function parseClaimableBalanceDecreaseEventData(eventData: ethers.utils.LogDescription): ClaimableBalanceDecreaseEvent {
  if (!eventData || !eventData.args || eventData.args.length != 3) {
    throw new Error(`Invalid eventData`)
  }

  return {
    eventName: LighterEventType.CLAIMABLE_BALANCE_DECREASE_EVENT,
    owner: eventData.args[0].toString(),
    amountDelta: BigNumber.from(eventData.args[1].toString()),
    isToken0: eventData.args[2].toString().toLowerCase() === 'true',
  }
}

const eventsParser: Record<LighterEventType, (eventData: ethers.utils.LogDescription) => LighterEvent> = {
  [LighterEventType.CREATE_ORDER_EVENT]: parseCreateOrderEventData,
  [LighterEventType.CANCEL_LIMIT_ORDER_EVENT]: parseCancelLimitOrderEventData,
  [LighterEventType.SWAP_EVENT]: parseSwapEventData,
  [LighterEventType.SWAP_EXACT_AMOUNT_EVENT]: parseSwapExactAmountEventData,
  [LighterEventType.FLASH_LOAN_EVENT]: parseFlashLoanEventData,
  [LighterEventType.CLAIMABLE_BALANCE_INCREASE_EVENT]: parseClaimableBalanceIncreaseEventData,
  [LighterEventType.CLAIMABLE_BALANCE_DECREASE_EVENT]: parseClaimableBalanceDecreaseEventData,
}

// === Event to string ===

function createOrderEventToString(e: LighterEvent): string {
  const event = e as CreateOrderEvent
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

function cancelLimitOrderEventToString(e: LighterEvent): string {
  const event = e as CancelLimitOrderEvent
  return `\n{
    eventName: ${event.eventName},
    id: ${event.id.toString()}
  }\n`
}

function swapEventToString(e: LighterEvent): string {
  const event = e as SwapEvent
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

function swapExactAmountEventToString(e: LighterEvent): string {
  const event = e as SwapExactAmountEvent
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

function flashLoanEventToString(e: LighterEvent): string {
  const event = e as FlashLoanEvent
  return `\n{
    eventName: ${event.eventName},
    sender: ${event.sender},
    recipient: ${event.recipient},
    amount0: ${event.amount0.toString()},
    amount1: ${event.amount1.toString()}
  }\n`
}

function claimableBalanceIncreaseEventToString(e: LighterEvent): string {
  const event = e as ClaimableBalanceIncreaseEvent
  return `\n{
    eventName: ${event.eventName},
    owner: ${event.owner},
    amountDelta: ${event.amountDelta.toString()},
    isToken0: ${event.isToken0}
  }\n`
}

function claimableBalanceDecreaseEventToString(e: LighterEvent): string {
  const event = e as ClaimableBalanceDecreaseEvent
  return `\n{
    eventName: ${event.eventName},
    owner: ${event.owner},
    amountDelta: ${event.amountDelta.toString()},
    isToken0: ${event.isToken0}
  }\n`
}

export function lighterEventToString(event: LighterEvent): string {
  const handler = eventsToString[event.eventName as LighterEventType]
  if (!handler) {
    return ''
  }
  return handler(event)
}

const eventsToString: Record<LighterEventType, (event: LighterEvent) => string> = {
  [LighterEventType.CREATE_ORDER_EVENT]: createOrderEventToString,
  [LighterEventType.CANCEL_LIMIT_ORDER_EVENT]: cancelLimitOrderEventToString,
  [LighterEventType.SWAP_EVENT]: swapEventToString,
  [LighterEventType.SWAP_EXACT_AMOUNT_EVENT]: swapExactAmountEventToString,
  [LighterEventType.FLASH_LOAN_EVENT]: flashLoanEventToString,
  [LighterEventType.CLAIMABLE_BALANCE_INCREASE_EVENT]: claimableBalanceIncreaseEventToString,
  [LighterEventType.CLAIMABLE_BALANCE_DECREASE_EVENT]: claimableBalanceDecreaseEventToString,
}
