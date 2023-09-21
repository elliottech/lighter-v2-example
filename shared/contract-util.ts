import * as RouterABI from '@elliottech/lighter-v2-periphery/artifacts/contracts/Router.sol/Router.json'
import * as OrderBookABI from '@elliottech/lighter-v2-core/artifacts/contracts/OrderBook.sol/OrderBook.json'
import * as IERC20MetadataABI from '../artifacts/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol/IERC20Metadata.json'
import * as FactoryABI from '@elliottech/lighter-v2-core/artifacts/contracts/Factory.sol/Factory.json'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {IOrderBook, IRouter, IFactory} from '../typechain-types'
import {IERC20Metadata} from '../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata'
import {OrderBookConfig} from '../config'
import {BigNumber} from 'ethers'

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

export const getFactoryAt = async (factoryAddress: string, hre: HardhatRuntimeEnvironment): Promise<IFactory> => {
  return (await hre.ethers.getContractAt(FactoryABI.abi, factoryAddress)) as any as IFactory
}

export const getOrderBookConfigFromOrderBookId = async (
  orderBookId: BigNumber,
  factoryAddress: string,
  hre: HardhatRuntimeEnvironment
): Promise<OrderBookConfig> => {
  const factory: IFactory = await getFactoryAt(factoryAddress, hre)
  const orderBookAddress = await factory.getOrderBookFromId(orderBookId)
  const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
  const token0 = await orderBookContract.token0()
  const token0Contract = await getTokenContractAt(token0, hre)
  const token1 = await orderBookContract.token1()
  const token1Contract = await getTokenContractAt(token1, hre)
  return await getOrderBookConfig(orderBookContract, token0Contract, token1Contract)
}

export const getOrderBookConfigFromAddress = async (
  orderBookAddress: string,
  hre: HardhatRuntimeEnvironment
): Promise<OrderBookConfig> => {
  const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
  const token0 = await orderBookContract.token0()
  const token0Contract = await getTokenContractAt(token0, hre)
  const token1 = await orderBookContract.token1()
  const token1Contract = await getTokenContractAt(token1, hre)
  return await getOrderBookConfig(orderBookContract, token0Contract, token1Contract)
}

export const getOrderBookConfig = async (
  orderBookContract: IOrderBook,
  token0Contract: IERC20Metadata,
  token1Contract: IERC20Metadata
): Promise<OrderBookConfig> => {
  const orderBookId = await orderBookContract.orderBookId()
  const orderIdCounter = await orderBookContract.orderIdCounter()
  const sizeTick = await orderBookContract.sizeTick()
  const priceTick = await orderBookContract.priceTick()
  const priceMultiplier = await orderBookContract.priceMultiplier()
  const priceDivider = await orderBookContract.priceDivider()
  const minToken0BaseAmount = await orderBookContract.minToken0BaseAmount()
  const minToken1BaseAmount = await orderBookContract.minToken1BaseAmount()
  const token0Address = token0Contract.address
  const token0Symbol = await token0Contract.symbol()
  const token0Name = await token0Contract.name()
  const token0Precision = await token0Contract.decimals()
  const token1Address = token1Contract.address
  const token1Symbol = await token1Contract.symbol()
  const token1Name = await token1Contract.name()
  const token1Precision = await token1Contract.decimals()

  return {
    orderBookId: BigNumber.from(orderBookId),
    nextOrderId: BigNumber.from(orderIdCounter),
    sizeTick,
    priceTick,
    priceMultiplier,
    priceDivider,
    minToken0BaseAmount,
    minToken1BaseAmount,
    token0Address,
    token0Symbol,
    token0Name,
    token0Precision,
    token1Address,
    token1Symbol,
    token1Name,
    token1Precision,
  }
}

export const getTokenDecimals = async (tokenAddress: string, hre: HardhatRuntimeEnvironment): Promise<number> => {
  const tokenContract = await getTokenContractAt(tokenAddress, hre)
  return await getTokenDecimalFromContract(tokenContract)
}

export const getTokenDecimalFromContract = async (tokenContract: IERC20Metadata): Promise<number> => {
  return await tokenContract.decimals()
}
