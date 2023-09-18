import {ChainKey, OrderBookKey, Token} from './types'
import {addresses} from './lighter-addresses'

export const getLighterConfig = (chainKey: ChainKey) => {
  return addresses[chainKey]
}

export const getRouterAddress = (chainKey: ChainKey): string => {
  return getLighterConfig(chainKey)?.Router
}

export const getFactoryAddress = (chainKey: ChainKey): string => {
  return getLighterConfig(chainKey)?.Factory
}

export const getOrderBookAddress = (chainKey: ChainKey, orderBookKey: OrderBookKey): string => {
  return getLighterConfig(chainKey)?.OrderBooks[orderBookKey] || ''
}

export const getTokenAddress = (chainKey: ChainKey, tokenKey: Token): string => {
  return getLighterConfig(chainKey)?.Tokens[tokenKey] || ''
}

// npx ts-node config/config-helpers.ts
// export const main = async () => {
//     const chainKey = ChainKey.ARBITRUM_GOERLI;
//     const lighterConfig = getLighterConfig(chainKey);
//     console.log(`lighterConfig for ${chainKey} is: ${JSON.stringify(lighterConfig)}`)
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error: Error) => {
//     console.error(error);
//     process.exit(1);
//   });
