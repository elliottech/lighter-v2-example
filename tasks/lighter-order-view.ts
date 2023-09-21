import {task, types} from 'hardhat/config'
import {BigNumber} from 'ethers'
import {Order, OrderBookKey, OrderData, getLighterConfig, orderDataToString, orderToString} from '../config'
import {OrderType, getOrderBookAt} from '../shared'
import {IOrderBook} from '../typechain-types'

// npx hardhat getOrderDetails --orderbookname WBTC-USDC --orderid 26 --network arbgoerli
task('getOrderDetails')
  .addParam('orderbookname')
  .addParam('orderid')
  .setAction(async ({orderbookname, orderid}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
    const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
    const order = await getOrderDetails(orderBookContract, BigNumber.from(orderid))
    if (!order) {
      console.error(`Order with id: ${orderid} doesnot exist`)
    } else {
      console.log(`${orderToString(order)}`)
    }
  })

// npx hardhat getAllLimitOrders --orderbookname WBTC-USDC --limit 10 --network arbgoerli
// npx hardhat getAllLimitOrders --orderbookname WBTC-USDC --network arbgoerli
task('getAllLimitOrders')
  .addParam('orderbookname')
  .addOptionalParam('limit', 'limit for the order-query', 100, types.int)
  .setAction(async ({orderbookname, limit}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
    const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
    const orderData: OrderData = await getAllLimitOrders(orderBookContract, BigNumber.from(0), parseInt(limit))
    console.log(`orderData queried: ${orderDataToString(orderData)}`)
  })

// npx hardhat getAllLimitOrdersOfAnAccount --orderbookname WBTC-USDC --account '0xd057E08695d1843FC21F27bBd0Af5D4B06203F48' --network arbgoerli
task('getAllLimitOrdersOfAnAccount')
  .addParam('orderbookname')
  .addParam('account')
  .addOptionalParam('limit', 'limit for the order-query', 100, types.int)
  .setAction(async ({orderbookname, account, limit}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
    const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
    const orderData: OrderData = await getAllLimitOrdersOfAnAccount(
      orderBookContract,
      account,
      BigNumber.from(0),
      parseInt(limit)
    )
    console.log(`orderData queried: ${orderDataToString(orderData)}`)
  })

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
