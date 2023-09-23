import {BigNumber, ethers} from 'ethers'

export enum OrderType {
  LimitOrder,
  PerformaceLimitOrder,
  FoKOrder,
  IoCOrder,
}

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

// UpdateLimitOrder action emits CancelLimitOrderEvent & CreateOrderEvent, SwapEvents
// all createOrder actions emits CreateOrderEvent, SwapEvents
// all SwapExact actions emits SwapEvents and SwapExactAmountEvent
// FlashLoan action emits FlashLoanEvent
export enum LighterAction {
  CREATE_LIMIT_ORDER,
  CREATE_BATCH_LIMIT_ORDER,
  CREATE_IOC_ORDER,
  CREATE_BATCH_IOC_ORDER,
  CREATE_FOK_ORDER,
  CREATE_BATCH_FOK_ORDER,
  CANCEL_LIMIT_ORDER,
  CANCEL_BATCH_LIMIT_ORDER,
  UPDATE_LIMIT_ORDER,
  SWAP_EXACT_INPUT_SINGLE,
  SWAP_EXACT_OUTPUT_SINGLE,
  FLASH_LOAN,
}

export enum LighterEventType {
  CREATE_ORDER_EVENT,
  CANCEL_LIMIT_ORDER_EVENT,
  SWAP_EVENT,
  SWAP_EXACT_AMOUNT_EVENT,
  FLASH_LOAN_EVENT,
  CLAIMABLE_BALANCE_INCREASE_EVENT,
  CLAIMABLE_BALANCE_DECREASE_EVENT,
}

export enum LighterContracts {
  ROUTER,
  ORDERBOOK,
}

export interface LighterEventSignature {
  contractName: LighterContracts
  eventSignature: string
  eventName: string
  parseEventFunction: any
}

export interface LighterFunctionSignature {
  contractName: LighterContracts
  functionSignature: string
  functionName: string
  functionSelector: string
}

export interface LighterEventWrapper {
  lighterAction: LighterAction
  createOrderEvents: CreateOrderEvent[]
  swapEvents: SwapEvent[]
  cancelLimitOrderEvents: CancelLimitOrderEvent[]
  swapExactAmountEvents: SwapExactAmountEvent[]
  flashLoanEvents: FlashLoanEvent[]
  claimableBalanceIncreaseEvents: ClaimableBalanceIncreaseEvent[]
  claimableBalanceDecreaseEvents: ClaimableBalanceDecreaseEvent[]
}

export interface CreateOrderEvent {
  owner: string
  id: BigNumber
  amount0Base: BigNumber
  priceBase: BigNumber
  isAsk: boolean
  orderType: OrderType
}

export interface SwapEvent {
  askId: BigNumber
  bidId: BigNumber
  askOwner: string
  bidOwner: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface CancelLimitOrderEvent {
  id: BigNumber
}

export interface SwapExactAmountEvent {
  sender: string
  recipient: string
  isExactInput: boolean
  isAsk: boolean
  swapAmount0: BigNumber
  swapAmount1: BigNumber
}

export interface FlashLoanEvent {
  sender: string
  recipient: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface ClaimableBalanceIncreaseEvent {
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}

export interface ClaimableBalanceDecreaseEvent {
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}
