import {task} from 'hardhat/config'
import {OrderBookConfig, OrderBookKey, getLighterConfig} from '../config'
import {getOrderBookConfigFromAddress, getOrderBookConfigFromOrderBookId} from '../shared'

// npx hardhat getOrderBookDetailsByOrderBookName --orderbookname WBTC-USDC --network arbgoerli
task('getOrderBookDetailsByOrderBookName')
  .addParam('orderbookname')
  .setAction(async ({orderbookname}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
    const orderBookConfig: OrderBookConfig = await getOrderBookConfigFromAddress(orderBookAddress, hre)
    console.log(`orderBookConfig for orderBookName: ${orderbookname} queried: ${JSON.stringify(orderBookConfig)}`)
  })

// npx hardhat getOrderBookDetailsById --orderbookid 0 --factoryaddress '0xB15457ea816677564145AF39D92A9aE68fde1E96' --network arbgoerli
task('getOrderBookDetailsById')
  .addParam('orderbookid')
  .addParam('factoryaddress')
  .setAction(async ({orderbookid, factoryaddress}, hre) => {
    const orderBookConfig: OrderBookConfig = await getOrderBookConfigFromOrderBookId(orderbookid, factoryaddress, hre)
    console.log(`orderBookConfig for orderBookId: ${orderbookid} queried as: ${JSON.stringify(orderBookConfig)}`)
  })
