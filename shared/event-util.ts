import '@nomiclabs/hardhat-ethers'
import {Provider} from '@ethersproject/providers'
import {getOrderBookAt} from '../shared'
import {BigNumber, ethers} from 'ethers'

export enum OrderType {
  LimitOrder,
  FoKOrder,
  IoCOrder,
  PerformaceLimitOrder,
}

// Function to get the string representation of an enum value
function getOrderTypeString(value: OrderType): string {
  switch (value) {
    case OrderType.LimitOrder:
      return 'LimitOrder'
    case OrderType.FoKOrder:
      return 'FoKOrder'
    case OrderType.IoCOrder:
      return 'IoCOrder'
    case OrderType.PerformaceLimitOrder:
      return 'PerformaceLimitOrder'
    default:
      throw new Error('Invalid enum value')
  }
}

// Function to get enum value from a number
export const getOrderTypeFromValue = (value: number): OrderType => {
  const orderTypes = Object.values(OrderType)
  const enumValue = orderTypes.find((enumItem) => typeof enumItem === 'number' && enumItem === value)
  return enumValue as OrderType
}

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
) => {
  const orderbookContract = await getOrderBookAt(orderBookAddress, hre)

  // Check if the contract ABI includes the event interface
  if (!orderbookContract.interface.events['CreateOrder(address,uint32,uint64,uint64,bool,uint8)']) {
    throw new Error("Event 'CreateOrder' not found in contract ABI.")
  }
  const txReceipt = await provider.getTransactionReceipt(transactionHash)

  let eventInterfaceBlock = orderbookContract.interface.events['CreateOrder(address,uint32,uint64,uint64,bool,uint8)']

  // Define the event interface with the full event structure
  let eventInterface = new ethers.utils.Interface([eventInterfaceBlock])

  // Filter the logs for the 'CreateOrder' event
  const decodedEventLogs = txReceipt.logs
    .filter((log) => log.topics[0] === eventInterface.getEventTopic('CreateOrder'))
    .map((log) => eventInterface.parseLog(log))

  if (!decodedEventLogs || !decodedEventLogs[0]) {
    throw new Error(`Failed to lookup for CreateOrder Event`)
  }

  const eventData = decodedEventLogs[0]

  return new CreateOrderEvent(
    eventData.args[0].toString(),
    BigNumber.from(eventData.args[1].toString()),
    BigNumber.from(eventData.args[2].toString()),
    BigNumber.from(eventData.args[3].toString()),
    eventData.args[4],
    getOrderTypeFromValue(parseInt(eventData.args[5]))
  )
}
