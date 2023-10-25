import * as RouterABI from '@elliottech/lighter-v2-periphery/artifacts/contracts/Router.sol/Router.json'
import * as OrderBookABI from '@elliottech/lighter-v2-core/artifacts/contracts/OrderBook.sol/OrderBook.json'
import * as FactoryABI from '@elliottech/lighter-v2-core/artifacts/contracts/Factory.sol/Factory.json'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {IERC20Metadata, IFactory, IOrderBook, IRouter} from '../typechain-types'
import {BigNumber} from 'ethers'

export const getRouterAt = async (routerAddress: string, hre: HardhatRuntimeEnvironment): Promise<IRouter> => {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(RouterABI.abi, routerAddress, signer)) as any as IRouter
}

export const getOrderBookAt = async (orderBookAddress: string, hre: HardhatRuntimeEnvironment): Promise<IOrderBook> => {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt(OrderBookABI.abi, orderBookAddress, signer)) as any as IOrderBook
}

export const getTokenAt = async (tokenAddress: string, hre: HardhatRuntimeEnvironment): Promise<IERC20Metadata> => {
  const [signer] = await hre.ethers.getSigners()
  const IERC20MetadataABI = require('../artifacts/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol/IERC20Metadata.json')
  return (await hre.ethers.getContractAt(IERC20MetadataABI.abi, tokenAddress, signer)) as any as IERC20Metadata
}

export const getFactoryAt = async (factoryAddress: string, hre: HardhatRuntimeEnvironment): Promise<IFactory> => {
  return (await hre.ethers.getContractAt(FactoryABI.abi, factoryAddress)) as any as IFactory
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

export const getOrderBookConfigFromAddress = async (
  orderBookAddress: string,
  hre: HardhatRuntimeEnvironment
): Promise<OrderBookConfig> => {
  const orderBookContract = await getOrderBookAt(orderBookAddress, hre)
  const token0 = await orderBookContract.token0()
  const token0Contract = await getTokenAt(token0, hre)
  const token1 = await orderBookContract.token1()
  const token1Contract = await getTokenAt(token1, hre)

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
    orderBookAddress,
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
