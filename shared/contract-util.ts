import * as RouterABI from '@elliottech/lighter-v2-periphery/artifacts/contracts/Router.sol/Router.json'
import * as OrderBookABI from '@elliottech/lighter-v2-core/artifacts/contracts/OrderBook.sol/OrderBook.json'
import * as IERC20MetadataABI from '../artifacts/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol/IERC20Metadata.json'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {IOrderBook, IRouter} from '../typechain-types'
import {IERC20Metadata} from '../typechain-types/extensions/IERC20Metadata'
import {OrderBookTick} from '../config'

export enum OrderType {
  LimitOrder,
  PerformaceLimitOrder,
  FoKOrder,
  IoCOrder,
}

// Function to get the string representation of an enum value
export const getOrderTypeString = (value: OrderType): string => {
  switch (value) {
    case OrderType.LimitOrder:
      return 'LimitOrder'
    case OrderType.FoKOrder:
      return 'FoKOrder'
    case OrderType.IoCOrder:
      return 'IoCOrder'
    case OrderType.PerformaceLimitOrder:
      return 'PerformaceLimitOrder'
    default:
      throw new Error('Invalid enum value')
  }
}

// Function to get enum value from a number
export const getOrderTypeFromValue = (value: number): OrderType => {
  const orderTypes = Object.values(OrderType)
  const enumValue = orderTypes.find((enumItem) => typeof enumItem === 'number' && enumItem === value)
  return enumValue as OrderType
}

export const getRouterAt = async (address: string, hre: HardhatRuntimeEnvironment): Promise<IRouter> => {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(RouterABI.abi, address, signer)) as any as IRouter
}

export const getOrderBookAt = async (orderBookAddress: string, hre: HardhatRuntimeEnvironment): Promise<IOrderBook> => {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(OrderBookABI.abi, orderBookAddress, signer)) as any as IOrderBook
}

export const getTokenContractAt = async (
  tokenAddress: string,
  hre: HardhatRuntimeEnvironment
): Promise<IERC20Metadata> => {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(IERC20MetadataABI.abi, tokenAddress, signer)) as any as IERC20Metadata
}

export const getOrderBookTicksFromAddress = async (
  orderBookAddress: string,
  hre: HardhatRuntimeEnvironment
): Promise<OrderBookTick> => {
  const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
  return await getOrderBookTicks(orderBookContract)
}

export const getOrderBookTicks = async (orderBookContract: IOrderBook): Promise<OrderBookTick> => {
  const SizeTick = await orderBookContract.sizeTick()
  const PriceTick = await orderBookContract.priceTick()
  return {SizeTick, PriceTick}
}

export const getTokenPrecisions = async (
  orderBookAddress: string,
  hre: HardhatRuntimeEnvironment
): Promise<{token0Precision: number; token1Precision: number}> => {
  const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
  const token0 = await orderBookContract.token0()
  const token0Precision = await getTokenDecimals(token0, hre)
  const token1 = await orderBookContract.token1()
  const token1Precision = await getTokenDecimals(token1, hre)
  return {token0Precision, token1Precision}
}

export const getTokenDecimals = async (tokenAddress: string, hre: HardhatRuntimeEnvironment): Promise<number> => {
  const tokenContract = await getTokenContractAt(tokenAddress, hre)
  return await getTokenDecimalFromContract(tokenContract)
}

export const getTokenDecimalFromContract = async (tokenContract: IERC20Metadata): Promise<number> => {
  return await tokenContract.decimals()
}
