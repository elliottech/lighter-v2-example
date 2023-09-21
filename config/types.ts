import {BigNumber} from 'ethers'

export enum OrderBookKey {
  WETH_USDC = 'WETH-USDC',
  WBTC_USDC = 'WBTC-USDC',
}

export enum Token {
  WETH = 'WETH',
  USDC = 'USDC',
  WBTC = 'WBTC',
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
  ARBITRUM_GOERLI = 421613,
}

export interface LighterConfig {
  Router: string
  Factory: string
  OrderBooks: Record<OrderBookKey, string>
  Tokens: Partial<Record<Token, string>>
  Vault: Partial<Record<Token, string>>
  AAVEPool: string
}

export interface OrderBookConfig {
  orderBookId: BigNumber
  sizeTick: BigNumber
  priceTick: BigNumber
}

export interface OrderBookTick {
  SizeTick: BigNumber
  PriceTick: BigNumber
}
