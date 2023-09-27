import {task} from 'hardhat/config'
import {getAllLighterEvents, printLighterEvents} from '../shared'

// npx hardhat getAllLighterEvents --transactionhash '0x72568e681288efbb79189945ce35c22676133e92c6e83e59737fdc5d2c00011f' --network arbgoerli
task('getAllLighterEvents')
  .addParam('transactionhash')
  .setDescription('get all lighterEvents emitted by OrderBook')
  .setAction(async ({transactionhash}, hre) => {
    const lighterEvents = await getAllLighterEvents(transactionhash, hre)

    const eventsAsString = lighterEvents.map((lighterEvent) => printLighterEvents(lighterEvent))
    console.log(
      `${lighterEvents.length} lighter-events emitted for transactionHash -> ${transactionhash}:\n\n ${eventsAsString}`
    )
  })
