import {ChainKey, LighterConfig, OrderBookKey, Token} from './types'

export const addresses: {
  [ChainKey: string]: LighterConfig
} = {
  [ChainKey.ARBITRUM_GOERLI]: {
    Router: '0x42E138965BaCDdF6E1fb2774C55ab84b471c0ab7',
    Factory: '0xB15457ea816677564145AF39D92A9aE68fde1E96',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: '0x5Fd98c554B29E0DE9DcF09eEd3339367C62b2606',
      [OrderBookKey.WBTC_USDC]: '0xa791f2eC05b6A6771397B4AE4fAb42E84bb22008',
    },
    Tokens: {
      [Token.WETH]: '0x4d541f0b8039643783492f9865c7f7de4f54eb5f',
      [Token.WBTC]: '0xf133eb356537f0b3b4fdfb98233b45ef8138aa56',
      [Token.USDC]: '0xcc4a8fa63ce5c6a7f4a7a3d2ebcb738ddcd31209',
    },
  },
  [ChainKey.ARBITRUM]: {
    Router: '',
    Factory: '',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: '',
      [OrderBookKey.WBTC_USDC]: '',
    },
    Tokens: {
      [Token.WETH]: '',
      [Token.WBTC]: '',
      [Token.USDC]: '',
    },
  },
}
