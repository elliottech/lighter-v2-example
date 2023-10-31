export enum OrderBookKey {
  WETH_USDC = 'WETH-USDC',
  WBTC_USDC = 'WBTC-USDC',
  USDT_USDC = 'USDT-USDC',
  WMATIC_USDC = 'WMATIC-USDC',
  WETH_USDT = 'WETH-USDT',
  WBNB_USDT = 'WBNB-USDT',
  BUSD_USDT = 'BUSD-USDT',
  BTCB_USDT = 'BTCB-USDT',
  USDC_USDT = 'USDC-USDT',
  WETH_USDCE = 'WETH-USDCE',
  USDT_USDCE = 'USDT-USDCE',
  USDC_USDCE = 'USDC-USDCE',
}

export enum Token {
  WETH = 'WETH',
  USDCE = 'USDCE',
  USDC = 'USDC',
  WBTC = 'WBTC',
  WMATIC = 'WMATIC',
  WBNB = 'WBNB',
  USDT = 'USDT',
  BTCB = 'BTCB',
  BUSD = 'BUSD',
  aArbWBTC = 'aArbWBTC',
  aArbWETH = 'aArbWETH',
  aArbUSDC = 'aArbUSDC',
  vArbWBTC = 'vArbWBTC',
  vArbWETH = 'vArbWETH',
  vArbUSDC = 'vArbUSDC',
}

export enum ChainId {
  HARDHAT = 31337,
  ARBITRUM = 42161,
  ARBITRUM_SEPOLIA = 421614,
  OPT_GOERLI = 420,
  MUMBAI = 80001,
  BSC_TESTNET = 97,
}

export interface LighterConfig {
  Router: string
  Factory: string
  OrderBooks: Partial<Record<OrderBookKey, string>>
  Tokens: Partial<Record<Token, string>>
  Vault: Partial<Record<Token, string>>
  AAVEPool?: string
}
