import {task, types} from 'hardhat/config'
import {BigNumber} from 'ethers'
import {
  OrderBookKey,
  OrderData,
  getAllLimitOrders,
  getAllLimitOrdersOfAnAccount,
  getLighterConfig,
  getOrderBookAt,
  getOrderDetails,
  orderDataToString,
  orderToString,
  getOrderBookConfigFromAddress,
} from '../sdk'

task('getOrderDetails')
  .addParam('orderbookname')
  .addParam('orderid')
  .setAction(async ({orderbookname, orderid}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
    if (!orderBookAddress) {
      throw new Error(`Invalid order book '${orderbookname}'`)
    }
    const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
    const order = await getOrderDetails(orderBookContract, BigNumber.from(orderid))
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
    if (!order) {
      console.error(`Order with id: ${orderid} doesnot exist`)
    } else {
      console.log(`${orderToString(orderBookConfig, order)}`)
    }
  })

task('getAllLimitOrders')
  .addParam('orderbookname')
  .addOptionalParam('limit', 'limit for the order-query', 100, types.int)
  .setAction(async ({orderbookname, limit}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
    if (!orderBookAddress) {
      throw new Error(`Invalid order book '${orderbookname}'`)
    }
    const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
    const orderData: OrderData = await getAllLimitOrders(orderBookContract, BigNumber.from(0), parseInt(limit))
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
    console.log(`orderData queried: \n${orderDataToString(orderBookConfig, orderData)}`)
  })

task('getAllLimitOrdersOfAnAccount')
  .addParam('orderbookname')
  .addParam('account')
  .addOptionalParam('limit', 'limit for the order-query', 100, types.int)
  .setAction(async ({orderbookname, account, limit}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey]
    if (!orderBookAddress) {
      throw new Error(`Invalid order book '${orderbookname}'`)
    }
    const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
    const orderData: OrderData = await getAllLimitOrdersOfAnAccount(
      orderBookContract,
      account,
      BigNumber.from(0),
      parseInt(limit)
    )
    const orderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
    console.log(`orderData queried: \n${orderDataToString(orderBookConfig, orderData)}`)
  })
