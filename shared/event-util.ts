import '@nomiclabs/hardhat-ethers'
import {Provider} from '@ethersproject/providers'
import {OrderType, getOrderBookAt, getOrderTypeFromValue, getTransactionReceipt} from '../shared'
import {BigNumber, ethers} from 'ethers'

// UpdateLimitOrder action emits CancelLimitOrderEvent & CreateOrderEvent, SwapEvents
// all createOrder actions emits CreateOrderEvent, SwapEvents
// all SwapExact actions emits SwapEvents and SwapExactAmountEvent
// FlashLoan action emits FlashLoanEvent
export enum LighterAction {
  CREATER_LIMIT_ORDER,
  CREATE_IOC_ORDER,
  CREATE_FOK_ORDER,
  CANCEL_LIMIT_ORDER,
  UPDATE_LIMIT_ORDER,
  SWAP_EXACT_INPUT_SINGLE,
  SWAP_EXACT_OUTPUT_SINGLE,
  FLASH_LOAN,
}

export interface LighterEventWrapper {
  lighterAction: LighterAction
  createOrderEvents: CreateOrderEvent[]
  swapEvents: SwapEvent[]
  cancelLimitOrderEvents: CancelLimitOrderEvent[]
  swapExactAmountEvents: SwapExactAmountEvent[]
  flashLoanEvent: FlashLoanEvent
  claimableBalanceIncreaseEvents: ClaimableBalanceIncreaseEvent[]
  claimableBalanceDecreaseEvents: ClaimableBalanceDecreaseEvent[]
}

export interface CreateOrderEvent {
  owner: string
  id: BigNumber
  amount0Base: BigNumber
  priceBase: BigNumber
  isAsk: boolean
  orderType: OrderType
}

export interface SwapEvent {
  askId: BigNumber
  bidId: BigNumber
  askOwner: string
  bidOwner: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface CancelLimitOrderEvent {
  id: BigNumber
}

export interface SwapExactAmountEvent {
  sender: string
  recipient: string
  isExactInput: boolean
  isAsk: boolean
  swapAmount0: BigNumber
  swapAmount1: BigNumber
}

export interface FlashLoanEvent {
  sender: string
  recipient: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface ClaimableBalanceIncreaseEvent {
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}

export interface ClaimableBalanceDecreaseEvent {
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}

export const getCreateOrderEvent = async (
  orderBookAddress: string,
  transactionHash: string,
  hre: any
): Promise<CreateOrderEvent[]> => {
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

  const eventSignature = 'CreateOrder(address,uint32,uint64,uint64,bool,uint8)'
  let eventInterfaceBlock = orderbookContract.interface.events[eventSignature]

  // Check if the contract ABI includes the event interface
  if (!eventInterfaceBlock) {
    throw new Error(`Event ${eventSignature} not found in Orderbook-contract ABI.`)
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

  // Filter the logs for the 'CreateOrder' event
  const decodedEventLogs = txReceipt.logs
    .filter((log) => log.topics[0] === eventInterface.getEventTopic('CreateOrder'))
    .map((log) => eventInterface.parseLog(log))

  if (!decodedEventLogs || decodedEventLogs.length == 0 || !decodedEventLogs[0]) {
    throw new Error(`Failed to lookup for CreateOrder Event`)
  }

  return decodedEventLogs.map((eventData) => parseCreateOrderEventData(eventData))
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

export const getSwapExactAmountEvent = async (
  orderBookAddress: string,
  transactionHash: string,
  hre: any
): Promise<SwapExactAmountEvent[]> => {
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

  const eventSignature = 'SwapExactAmount(address,address,bool,bool,uint256,uint256)'
  let eventInterfaceBlock = orderbookContract.interface.events[eventSignature]

  // Check if the contract ABI includes the event interface
  if (!eventInterfaceBlock) {
    throw new Error(`Event ${eventSignature} not found in Orderbook-contract ABI.`)
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

  // Filter the logs for the 'SwapExactAmount' event
  const decodedEventLogs = txReceipt.logs
    .filter((log) => log.topics[0] === eventInterface.getEventTopic('SwapExactAmount'))
    .map((log) => eventInterface.parseLog(log))

  if (!decodedEventLogs || decodedEventLogs.length == 0 || !decodedEventLogs[0]) {
    throw new Error(`Failed to lookup for SwapExactAmount Event`)
  }

  return decodedEventLogs.map((eventData) => parseSwapExactAmountEventData(eventData))
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
