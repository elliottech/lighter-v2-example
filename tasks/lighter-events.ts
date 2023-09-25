import {task} from 'hardhat/config'
import {LighterAction, OrderBookConfig, getLighterConfig, lighterFunctionSignatures} from '../config'
import {getAllLighterEvents, getOrderBookConfigFromOrderBookId, getOrderBookId} from '../shared'

// npx hardhat getAllLighterEvents --transactionhash '0x72568e681288efbb79189945ce35c22676133e92c6e83e59737fdc5d2c00011f' --network arbgoerli
task('getAllLighterEvents')
  .addParam('transactionhash')
  .setDescription('get all lighterEvents emitted by OrderBook')
  .setAction(async ({transactionhash}, hre) => {
    //get orderBookId from txData
    const orderBookId = await getOrderBookId(transactionhash, hre)

    //get OrderBookAddress from orderBookId
    const lighterConfig = await getLighterConfig()
    const orderBookConfig: OrderBookConfig = await getOrderBookConfigFromOrderBookId(
      orderBookId,
      lighterConfig.Factory,
      hre
    )

    const lighterEvents = await getAllLighterEvents(orderBookConfig.orderBookAddress, transactionhash, hre)
    console.log(`OrderEvent: ${JSON.stringify(lighterEvents, null, 2)} emitted for transactionHash: ${transactionhash}`)
  })

// npx hardhat getFuncSignature --network arbgoerli
task('getFuncSignature').setAction(async ({}, hre) => {
  const lighterFuncSing = lighterFunctionSignatures[LighterAction.CREATE_LIMIT_ORDER]
  console.log(`lighterFuncSing: ${JSON.stringify(lighterFuncSing, null, 2)}`)
})
