import '@nomiclabs/hardhat-ethers'
import {Provider} from '@ethersproject/providers'
import {OrderType, getOrderBookAt, getOrderTypeFromValue, getTransactionReceipt} from '../shared'
import {BigNumber, ethers} from 'ethers'

export class CreateOrderEvent {
  constructor(
    public owner: string,
    public id: BigNumber,
    public amount0Base: BigNumber,
    public priceBase: BigNumber,
    public isAsk: boolean,
    public orderType: OrderType
  ) {}
}

export const getCreateOrderEvent = async (
  provider: Provider,
  orderBookAddress: string,
  transactionHash: string,
  hre: any
): Promise<CreateOrderEvent> => {
  if (!orderBookAddress) {
    throw new Error(`Invalid orderBookAddress`)
  }

  if (!transactionHash) {
    throw new Error(`Invalid transactionHash`)
  }

  if (!provider || provider._isProvider) {
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

  const eventData = decodedEventLogs[0]

  if (!eventData || !eventData.args || eventData.args.length != 6) {
    throw new Error(`Invalid eventData`)
  }

  return new CreateOrderEvent(
    eventData.args[0].toString(),
    BigNumber.from(eventData.args[1].toString()),
    BigNumber.from(eventData.args[2].toString()),
    BigNumber.from(eventData.args[3].toString()),
    eventData.args[4],
    getOrderTypeFromValue(parseInt(eventData.args[5]))
  )
}

class SwapExactAmountEvent {
  constructor(
    public sender: string,
    public recipient: string,
    public isExactInput: boolean,
    public isAsk: boolean,
    public swapAmount0: BigNumber,
    public swapAmount1: BigNumber
  ) {}
}

export const getSwapExactAmountEvent = async (
  provider: Provider,
  orderBookAddress: string,
  transactionHash: string,
  hre: any
): Promise<SwapExactAmountEvent> => {
  if (!orderBookAddress) {
    throw new Error(`Invalid orderBookAddress`)
  }

  if (!transactionHash) {
    throw new Error(`Invalid transactionHash`)
  }

  if (!provider || provider._isProvider) {
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

  const eventData = decodedEventLogs[0]

  if (!eventData || !eventData.args || eventData.args.length != 6) {
    throw new Error(`Invalid SwapExactAmount EventData`)
  }

  return new SwapExactAmountEvent(
    eventData.args[0].toString(),
    eventData.args[1].toString(),
    eventData.args[2].toString(),
    eventData.args[3].toString(),
    BigNumber.from(eventData.args[4]),
    BigNumber.from(eventData.args[5])
  )
}
