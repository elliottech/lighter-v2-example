import {task} from 'hardhat/config'
import {CreateOrderEvent, LighterEventType, OrderBookKey, getLighterConfig} from '../config'
import {getLighterEventsByEventType} from '../shared/event-util'

// npx hardhat getCreateOrderEvent --orderbookname WETH-USDC --transactionhash '0x72568e681288efbb79189945ce35c22676133e92c6e83e59737fdc5d2c00011f'  --network arbgoerli
task('getCreateOrderEvent')
  .addParam('orderbookname')
  .addParam('transactionhash')
  .setDescription('getCreateOrderEvent via OrderBook')
  .setAction(async ({orderbookname, transactionhash}, hre) => {
    const lighterConfig = await getLighterConfig()
    const orderBookAddress = lighterConfig.OrderBooks[orderbookname as OrderBookKey] as string
    const createOrderEvents: CreateOrderEvent[] = (await getLighterEventsByEventType(
      orderBookAddress,
      transactionhash,
      LighterEventType.CREATE_ORDER_EVENT,
      hre
    )) as CreateOrderEvent[]
    console.log(
      `OrderEvent: ${JSON.stringify(createOrderEvents, null, 2)} emitted for transactionHash: ${transactionhash}`
    )
  })
