import {BigNumber} from 'ethers'
import {IOrderBook} from '../typechain-types'
import {OrderBookConfig} from './contract'
import {formatUnits} from 'ethers/lib/utils'

export enum OrderType {
  LimitOrder,
  PerformanceLimitOrder,
  FoKOrder,
  IoCOrder,
}

export interface Order {
  id: BigNumber
  isAsk: boolean
  owner: string
  amount0: BigNumber
  price: BigNumber
  orderType: OrderType
}

export interface OrderData {
  limit: number
  orderCount: number
  askOrderCount: number
  bidOrderCount: number
  askOrders: Order[]
  bidOrders: Order[]
}

// Define a custom toString function for the Order interface
export const orderToString = (orderBookConfig: OrderBookConfig, order: Order): string => {
  return `  Owner: ${order.owner} OrderType: ${order.orderType} ID: ${order.id.toString()}
  Amount0: ${formatUnits(order.amount0, orderBookConfig.token0Precision)} Price: ${formatUnits(
    order.price,
    orderBookConfig.token1Precision
  )}`
}

// Define a custom toString function for the OrderData interface
export const orderDataToString = (orderBookConfig: OrderBookConfig, orderData: OrderData): string => {
  const {limit, orderCount, askOrderCount, bidOrderCount, askOrders, bidOrders} = orderData

  const askOrdersString = askOrders.map((order) => orderToString(orderBookConfig, order)).join('\n\n')
  const bidOrdersString = bidOrders.map((order) => orderToString(orderBookConfig, order)).join('\n\n')

  return ` Order Data:
  Limit: ${limit}
  Total Order Count: ${orderCount}
  Ask Order Count: ${askOrderCount}
  Bid Order Count: ${bidOrderCount}

  Ask Orders:\n
${askOrdersString}

  Bid Orders:\n
${bidOrdersString}`
}

export const getAllLimitOrdersOfAnAccount = async (
  orderBookContract: IOrderBook,
  account: string,
  startOrderId: BigNumber,
  limit: number
): Promise<OrderData> => {
  const orderData = await getAllLimitOrders(orderBookContract, startOrderId, limit)

  const orders: Order[] = []
  let askOrderCount: number = 0,
    bidOrderCount: number = 0

  const askOrders = orderData.askOrders.filter((order) => order.owner == account)

  if (askOrders) {
    orders.push(...askOrders)
    askOrderCount = askOrders.length
  }

  const bidOrders = orderData.bidOrders.filter((order) => order.owner == account)

  if (bidOrders) {
    orders.push(...bidOrders)
    bidOrderCount = bidOrders.length
  }

  return {limit, orderCount: askOrderCount + bidOrderCount, askOrderCount, bidOrderCount, askOrders, bidOrders}
}

export const getOrderDetails = async (
  orderBookContract: IOrderBook,
  orderId: BigNumber
): Promise<Order | undefined> => {
  const orderData: OrderData = await getAllLimitOrders(orderBookContract, BigNumber.from(0), 1000)

  if (orderData.askOrderCount > 0) {
    const matchedAskOrder = orderData.askOrders.find((order) => order.id.eq(orderId))
    if (matchedAskOrder) {
      return matchedAskOrder
    }
  } else if (orderData.bidOrderCount > 0) {
    const matchedBidOrder = orderData.bidOrders.find((order) => order.id.eq(orderId))
    if (matchedBidOrder) {
      return matchedBidOrder
    }
  }
}

export const getAllLimitOrders = async (
  orderBookContract: IOrderBook,
  startOrderId: BigNumber,
  limit: number
): Promise<OrderData> => {
  const orders: Order[] = []
  let askOrderCount: number = 0,
    bidOrderCount: number = 0
  const askOrders = await getAllLimitOrdersBySide(orderBookContract, startOrderId, true, limit)

  if (askOrders) {
    orders.push(...askOrders)
    askOrderCount = askOrders.length
  }

  const bidOrders = await getAllLimitOrdersBySide(orderBookContract, startOrderId, false, limit)

  if (bidOrders) {
    orders.push(...bidOrders)
    bidOrderCount = bidOrders.length
  }

  return {limit, orderCount: askOrderCount + bidOrderCount, askOrderCount, bidOrderCount, askOrders, bidOrders}
}

export const getAllLimitOrdersBySide = async (
  orderBookContract: IOrderBook,
  startOrderId: BigNumber,
  isAsk: boolean,
  limit: number
): Promise<Order[]> => {
  try {
    const orderData = await orderBookContract.getPaginatedOrders(startOrderId, isAsk, limit)
    return parseOrders(isAsk, orderData)
  } catch (error) {
    return []
  }
}

export const parseOrders = (isAsk: boolean, orderData: IOrderBook.OrderQueryItemStructOutput): Order[] => {
  const orders: Order[] = []

  for (let i = 0; i < orderData.ids.length; i++) {
    const id = BigNumber.from(orderData.ids[i].toString())
    const owner = orderData.owners[i].toString()
    const amount0 = BigNumber.from(orderData.amount0s[i].toString())
    const price = BigNumber.from(orderData.prices[i].toString())

    if (owner !== '0x0000000000000000000000000000000000000000') {
      orders.push({id, isAsk, owner, amount0, price, orderType: OrderType.LimitOrder})
    }
  }

  return orders
}
