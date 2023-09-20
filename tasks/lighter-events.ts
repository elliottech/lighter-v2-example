import {task} from 'hardhat/config'
import {OrderBookConfig, OrderBookKey, getLighterConfig} from '../config'
import {CreateOrderEvent, getCreateOrderEvent} from '../shared/event-util'

// npx hardhat getCreateOrderEvent --orderbookname WBTC-USDC --transactionhash '0xcfc6a8e0968e861f7f04ec3bc788a210c3ef1c50a54d26ae4be62206deb65d22'  --network arbgoerli
task('getCreateOrderEvent')
  .addParam('orderbookname')
  .addParam('transactionhash')
  .setDescription('getCreateOrderEvent via OrderBook')
  .setAction(async ({orderbookname, transactionhash}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookConfig = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as OrderBookConfig
    const createOrderEvent: CreateOrderEvent = await getCreateOrderEvent(
      hre.ethers.provider,
      orderBookConfig.Address,
      transactionhash,
      hre
    )
    console.log(
      `OrderEvent: ${JSON.stringify(createOrderEvent, null, 2)} emitted for transactionHash: ${transactionhash}`
    )
  })
