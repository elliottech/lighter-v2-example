import {ChainId, OrderBookKey, Token} from './types'
import {addresses} from './lighter-addresses'
import {network} from 'hardhat'

export const getChainId = async (): Promise<ChainId> => {
  const chainId = await network.provider.request({method: 'eth_chainId'})
  const chainIdValue = parseInt(chainId as string)
  return chainIdValue
}

export const getLighterConfig = async () => {
  const chainId = await getChainId()
  if (!chainId || !ChainId[chainId]) {
    throw new Error(`ChainId ${chainId} is not supported`)
  }
  return getLighterConfigFromChainId(chainId)
}

export const getLighterConfigFromChainId = async (chainId: ChainId) => {
  return addresses[chainId]
}

// npx ts-node config/config-helpers.ts
// export const main = async () => {
//   const lighterConfig = await getLighterConfigFromChainId(ChainId.ARBITRUM_GOERLI)
//   console.log(`lighterConfig is: ${JSON.stringify(lighterConfig)}`)
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error: Error) => {
//     console.error(error)
//     process.exit(1)
//   })
