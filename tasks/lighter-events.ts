import {task} from 'hardhat/config'
import {getAllLighterEvents, lighterEventToString} from '../sdk'

task('getAllLighterEvents')
  .addParam('transactionhash')
  .setDescription('get all lighterEvents emitted by OrderBook')
  .setAction(async ({transactionhash}, hre) => {
    const lighterEvents = await getAllLighterEvents(transactionhash, hre.ethers.provider)

    const eventsAsString = lighterEvents.map((lighterEvent) => lighterEventToString(lighterEvent))
    console.log(
      `${lighterEvents.length} lighter-events emitted for transactionHash -> ${transactionhash}:\n\n ${eventsAsString}`
    )
  })
