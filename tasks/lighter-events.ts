import {task} from 'hardhat/config'
import {OrderBookConfig, OrderBookKey, getLighterConfig} from '../config'
import {CreateOrderEvent, getCreateOrderEvent} from '../shared/event-util'

// npx hardhat getCreateOrderEvent --orderbookname WETH-USDC --transactionhash '0x72568e681288efbb79189945ce35c22676133e92c6e83e59737fdc5d2c00011f'  --network arbgoerli
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
