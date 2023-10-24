import {BigNumber} from 'ethers'

export enum OrderType {
  LimitOrder,
  PerformanceLimitOrder,
  FoKOrder,
  IoCOrder,
}

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
  ARBITRUM_GOERLI = 421613,
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

export interface OrderBookConfig {
  orderBookAddress: string
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
  CREATE_LIMIT_ORDER_FALLBACK,
  CREATE_LIMIT_ORDER_BATCH,
  CREATE_LIMIT_ORDER_BATCH_FALLBACK,
  CREATE_IOC_ORDER,
  CREATE_IOC_ORDER_FALLBACK,
  CREATE_FOK_ORDER,
  CREATE_FOK_ORDER_FALLBACK,
  CANCEL_LIMIT_ORDER,
  CANCEL_LIMIT_ORDER_FALLBACK,
  CANCEL_LIMIT_ORDER_BATCH,
  CANCEL_LIMIT_ORDER_BATCH_FALLBACK,
  UPDATE_LIMIT_ORDER,
  UPDATE_LIMIT_ORDER_FALLBACK,
  UPDATE_LIMIT_ORDER_BATCH,
  SWAP_EXACT_INPUT_SINGLE,
  SWAP_EXACT_INPUT_SINGLE_FALLBACK,
  SWAP_EXACT_INPUT_MULTI,
  SWAP_EXACT_INPUT_MULTI_FALLBACK,
  SWAP_EXACT_OUTPUT_SINGLE,
  SWAP_EXACT_OUTPUT_SINGLE_FALLBACK,
  SWAP_EXACT_OUTPUT_MULTI,
  SWAP_EXACT_OUTPUT_MULTI_FALLBACK,
  FLASH_LOAN,
}

export const getOrderTypeFromLighterAction = (lighterAction: LighterAction): OrderType => {
  switch (lighterAction) {
    case LighterAction.CREATE_LIMIT_ORDER:
      return OrderType.LimitOrder

    case LighterAction.CREATE_FOK_ORDER:
      return OrderType.FoKOrder

    case LighterAction.CREATE_IOC_ORDER:
      return OrderType.IoCOrder

    default:
      throw new Error(`LighterAction: ${lighterAction} is not relevant for OrderType lookup`)
  }
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

export type LighterEvent =
  | CreateOrderEvent
  | SwapEvent
  | CancelLimitOrderEvent
  | SwapExactAmountEvent
  | FlashLoanEvent
  | ClaimableBalanceIncreaseEvent
  | ClaimableBalanceDecreaseEvent

export const CREATE_ORDER_EVENT_NAME = 'CreateOrderEvent'
export const CANCEL_LIMIT_ORDER_EVENT_NAME = 'CancelLimitOrderEvent'
export const SWAP_EVENT_NAME = 'SwapEvent'
export const SWAP_EXACT_AMOUNT_EVENT_NAME = 'SwapExactAmountEvent'
export const FLASH_LOAN_EVENT_NAME = 'FlashLoanEvent'
export const CLAIMABLE_BALANCE_INCREASE_EVENT = 'ClaimableBalanceIncreaseEvent'
export const CLAIMABLE_BALANCE_DECREASE_EVENT = 'ClaimableBalanceDecreaseEvent'

export interface CreateOrderEvent {
  eventName: string
  owner: string
  id: BigNumber
  amount0Base: BigNumber
  priceBase: BigNumber
  isAsk: boolean
  orderType: OrderType
}

export interface SwapEvent {
  eventName: string
  askId: BigNumber
  bidId: BigNumber
  askOwner: string
  bidOwner: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface CancelLimitOrderEvent {
  eventName: string
  id: BigNumber
}

export interface SwapExactAmountEvent {
  eventName: string
  sender: string
  recipient: string
  isExactInput: boolean
  isAsk: boolean
  swapAmount0: BigNumber
  swapAmount1: BigNumber
}

export interface FlashLoanEvent {
  eventName: string
  sender: string
  recipient: string
  amount0: BigNumber
  amount1: BigNumber
}

export interface ClaimableBalanceIncreaseEvent {
  eventName: string
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}

export interface ClaimableBalanceDecreaseEvent {
  eventName: string
  owner: string
  amountDelta: BigNumber
  isToken0: boolean
}
