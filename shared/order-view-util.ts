import {BigNumber} from 'ethers'
import {Order, OrderData, OrderType} from '../config'
import {IOrderBook} from '../typechain-types'

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
  let orderData = {}
  try {
    orderData = await orderBookContract.getPaginatedOrders(startOrderId, isAsk, limit)
    return parseOrders(isAsk, orderData)
  } catch (error) {
    return []
  }
}

export const parseOrders = (isAsk: boolean, orderData: IOrderBook.OrderQueryItemStructOutput): Order[] => {
  const [ids, owners, amount0s, prices] = orderData.slice(1) // Skip the first item in orderData

  const orders: Order[] = []

  //@ts-ignore
  for (let i = 0; i < ids.length; i++) {
    const id = BigNumber.from(ids[i].toString())
    const owner = owners[i].toString()
    const amount0 = BigNumber.from(amount0s[i].toString())
    const price = BigNumber.from(prices[i].toString())

    if (owner !== '0x0000000000000000000000000000000000000000') {
      orders.push({id, isAsk, owner, amount0, price, orderType: OrderType.LimitOrder})
    }
  }

  return orders
}
