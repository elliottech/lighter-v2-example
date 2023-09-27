import {task, types} from 'hardhat/config'
import {BigNumber} from 'ethers'
import {OrderBookKey, OrderData, getLighterConfig, orderDataToString, orderToString} from '../config'
import {getAllLimitOrders, getAllLimitOrdersOfAnAccount, getOrderBookAt, getOrderDetails} from '../shared'

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
