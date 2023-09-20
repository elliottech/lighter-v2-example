import * as RouterABI from '@elliottech/lighter-v2-periphery/artifacts/contracts/Router.sol/Router.json'
import * as OrderBookABI from '@elliottech/lighter-v2-core/artifacts/contracts/OrderBook.sol/OrderBook.json'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {IOrderBook, IRouter} from '../typechain-types'

export enum OrderType {
  LimitOrder,
  PerformaceLimitOrder,
  FoKOrder,
  IoCOrder,
}

// Function to get the string representation of an enum value
function getOrderTypeString(value: OrderType): string {
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

export const getOrderBookAt = async (address: string, hre: HardhatRuntimeEnvironment): Promise<IOrderBook> => {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(OrderBookABI.abi, address, signer)) as any as IOrderBook
}
