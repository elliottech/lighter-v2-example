import {ChainId, LighterConfig, OrderBookKey, Token} from './types'

export const addresses: {
  [ChainId: string]: LighterConfig
} = {
  [ChainId.ARBITRUM_GOERLI]: {
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
    VaultAddress: '',
  },
  [ChainId.ARBITRUM]: {
    Router: '',
    Factory: '',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: '',
      [OrderBookKey.WBTC_USDC]: '',
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
    VaultAddress: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
  },
}
