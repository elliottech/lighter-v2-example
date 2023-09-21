import {BigNumber} from 'ethers'
import {OrderType} from 'shared'

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
  nextOrderId: BigNumber
  sizeTick: BigNumber
  priceTick: BigNumber
  priceMultiplier: BigNumber
  priceDivider: BigNumber
  minToken0BaseAmount: BigNumber
  minToken1BaseAmount: BigNumber
  token0Address: string
  token0Symbol: string
  token0Name: string
  token0Precision: number
  token1Address: string
  token1Symbol: string
  token1Name: string
  token1Precision: number
}

export interface Order {
  id: BigNumber
  isAsk: boolean
  owner: string
  amount0: BigNumber
  price: BigNumber
  orderType: OrderType
}

export interface OrderData {
  limit: number
  orderCount: number
  askOrderCount: number
  bidOrderCount: number
  askOrders: Order[]
  bidOrders: Order[]
}

// Define a custom toString function for the Order interface
export const orderToString = (order: Order): string => {
  return `Order Details:
  ID: ${order.id.toString()}
  Is Ask: ${order.isAsk ? 'Yes' : 'No'}
  Owner: ${order.owner}
  Amount0: ${order.amount0.toString()}
  Price: ${order.price.toString()}
  Order Type: ${order.orderType}`
}

// Define a custom toString function for the OrderData interface
export const orderDataToString = (orderData: OrderData): string => {
  const {limit, orderCount, askOrderCount, bidOrderCount, askOrders, bidOrders} = orderData

  const askOrdersString = askOrders.map((order) => orderToString(order)).join('\n\n')
  const bidOrdersString = bidOrders.map((order) => orderToString(order)).join('\n\n')

  return `\n Order Data: \n
  Limit: ${limit}
  Total Order Count: ${orderCount}
  Ask Order Count: ${askOrderCount}
  Bid Order Count: ${bidOrderCount}

  Ask Orders:\n
  ${askOrdersString}

  Bid Orders:\n
  ${bidOrdersString}`
}
