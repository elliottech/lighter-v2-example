import {BigNumber} from 'ethers'
import {ChainId, LighterConfig, OrderBookKey, Token} from './types'

const lighterConfigs: {
  [ChainId: string]: LighterConfig
} = {
  [ChainId.ARBITRUM_GOERLI]: {
    Router: '0x42E138965BaCDdF6E1fb2774C55ab84b471c0ab7',
    Factory: '0xB15457ea816677564145AF39D92A9aE68fde1E96',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: {
        Address: '0x5Fd98c554B29E0DE9DcF09eEd3339367C62b2606',
        Id: BigNumber.from(0),
      },
      [OrderBookKey.WBTC_USDC]: {
        Address: '0xa791f2eC05b6A6771397B4AE4fAb42E84bb22008',
        Id: BigNumber.from(1),
      },
    },
    Tokens: {
      [Token.WETH]: '0x4d541f0b8039643783492f9865c7f7de4f54eb5f',
      [Token.WBTC]: '0xf133eb356537f0b3b4fdfb98233b45ef8138aa56',
      [Token.USDC]: '0xcc4a8fa63ce5c6a7f4a7a3d2ebcb738ddcd31209',

      // this are not real AAVE tokens, but they are here so the tests are passing
      // when deploying tokens using testnet forking
      [Token.aArbWETH]: '0x4d541f0b8039643783492f9865c7f7de4f54eb5f',
      [Token.aArbWBTC]: '0xf133eb356537f0b3b4fdfb98233b45ef8138aa56',
      [Token.aArbUSDC]: '0xcc4a8fa63ce5c6a7f4a7a3d2ebcb738ddcd31209',
      [Token.vArbWETH]: '0x4d541f0b8039643783492f9865c7f7de4f54eb5f',
      [Token.vArbWBTC]: '0xf133eb356537f0b3b4fdfb98233b45ef8138aa56',
      [Token.vArbUSDC]: '0xcc4a8fa63ce5c6a7f4a7a3d2ebcb738ddcd31209',
    },
    Vault: {
      [Token.WETH]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.WBTC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.USDC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
    },
    AAVEPool: '',
  },
  [ChainId.ARBITRUM]: {
    Router: '',
    Factory: '',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: {Address: '', Id: 0},
      [OrderBookKey.WBTC_USDC]: {Address: '', Id: 0},
    },
    Tokens: {
      [Token.WETH]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      [Token.WBTC]: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      [Token.USDC]: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      [Token.aArbWETH]: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
      [Token.aArbWBTC]: '0x078f358208685046a11C85e8ad32895DED33A249',
      [Token.aArbUSDC]: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
      [Token.vArbWETH]: '0x0c84331e39d6658Cd6e6b9ba04736cC4c4734351',
      [Token.vArbWBTC]: '0x92b42c66840C7AD907b4BF74879FF3eF7c529473',
      [Token.vArbUSDC]: '0xFCCf3cAbbe80101232d343252614b6A3eE81C989',
    },
    Vault: {
      [Token.WETH]: '0x940a7ed683a60220de573ab702ec8f789ef0a402',
      [Token.WBTC]: '0x7546966122e636a601a3ea4497d3509f160771d8',
      [Token.USDC]: '0x5bdf85216ec1e38d6458c870992a69e38e03f7ef',
      [Token.aArbWETH]: '0x6286b9f080d27f860f6b4bb0226f8ef06cc9f2fc',
      [Token.aArbWBTC]: '0x91746d6f9df58b9807a5bb0e54e4ea86600c2dba',
      [Token.aArbUSDC]: '0x3155c5a49aa31ee99ea7fbcb1258192652a8001c',
    },
    AAVEPool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
}

async function getChainId(): Promise<ChainId> {
  let network = require('hardhat').network
  const chainId = await network.provider.request({method: 'eth_chainId'})
  return parseInt(chainId as string)
}

export async function getLighterConfig(forceTestnet?: boolean) {
  if (forceTestnet) {
    return lighterConfigs[ChainId.ARBITRUM_GOERLI]
  }

  const chainId = await getChainId()
  if (!chainId) {
    throw new Error(`ChainId ${chainId} is not supported`)
  }

  // assume mainnet forking is enabled for hardhat network
  if (chainId == ChainId.HARDHAT) {
    return lighterConfigs[ChainId.ARBITRUM]
  }

  if (!ChainId[chainId]) {
    throw new Error(`ChainId ${chainId} is not supported`)
  }
  return lighterConfigs[chainId]
}
