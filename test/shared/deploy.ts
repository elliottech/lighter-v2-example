import * as IATokenABI from '@aave/core-v3/artifacts/contracts/interfaces/IAToken.sol/IAToken.json'
import * as AAVEPoolV3 from '@aave/core-v3/artifacts/contracts/protocol/pool/Pool.sol/Pool.json'
import {IAToken, IPool} from '@aave/core-v3/dist/types/types'
import {ethers} from 'hardhat'
import {Contract} from 'ethers'
import {getLighterConfig, LighterConfig} from '../../config'
import {IERC20Metadata, IFactory, IOrderBook, MarginWallet, MarketMakingWallet, SwapWallet} from '../../typechain-types'
import * as Factory from '@elliottech/lighter-v2-core/artifacts/contracts/Factory.sol/Factory.json'
import * as OrderBook from '@elliottech/lighter-v2-core/artifacts/contracts/OrderBook.sol/OrderBook.json'
import {PromiseOrValue} from '../../typechain-types/common'
import {fundAccount} from '../token'
import {ParseUSDC, ParseWETH} from './amount'

export async function getAAVEPoolAt(address: string): Promise<IPool> {
  const [signer] = await ethers.getSigners()
  return new Contract(address, AAVEPoolV3.abi, signer) as IPool
}

export async function getFactoryAt(address: string): Promise<IFactory> {
  const [signer] = await ethers.getSigners()
  return new Contract(address, Factory.abi, signer) as IFactory
}

export async function getTokenAt(address: string): Promise<IERC20Metadata> {
  const [signer] = await ethers.getSigners()
  return (await ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

export async function getATokenAt(address: string): Promise<IAToken> {
  const [signer] = await ethers.getSigners()
  return new Contract(address, IATokenABI.abi, signer) as IAToken
}

export async function getOrderBookAt(address: PromiseOrValue<string>): Promise<IOrderBook> {
  const [owner] = await ethers.getSigners()
  return new Contract(await address, OrderBook.abi, owner) as IOrderBook
}

export async function deployTokens(config?: LighterConfig) {
  if (config == null) {
    config = await getLighterConfig()
  }

  return {
    weth: await getTokenAt(config.Tokens['WETH']!),
    aweth: await getATokenAt(config.Tokens['aArbWETH']!),
    vweth: await getTokenAt(config.Tokens['vArbWETH']!),

    usdc: await getTokenAt(config.Tokens['USDC']!),
    ausdc: await getATokenAt(config.Tokens['aArbUSDC']!),
    vusdc: await getTokenAt(config.Tokens['vArbUSDC']!),
  }
}

export async function deployMarginWallet(pool: IPool) {
  const factory = await ethers.getContractFactory('MarginWallet')
  return (await factory.deploy(pool.address)) as MarginWallet
}

export async function deployMarketMakingWallet(factory: IFactory) {
  const contractFactory = await ethers.getContractFactory('MarketMakingWallet')
  return (await contractFactory.deploy(factory.address)) as MarketMakingWallet
}

export async function deploySwapWallet(factory: IFactory) {
  const contractFactory = await ethers.getContractFactory('SwapWallet')
  return (await contractFactory.deploy(factory.address)) as SwapWallet
}

export async function deployContracts(fundWallet = true) {
  const config = await getLighterConfig(true)
  const factory = await getFactoryAt(config.Factory)
  const orderBook = await getOrderBookAt(factory.getOrderBookFromId(0))
  const mmWallet = await deployMarketMakingWallet(factory)
  const swapWallet = await deploySwapWallet(factory)
  const tokens = await deployTokens(config)

  if (fundWallet) {
    for (const wallet of [mmWallet, swapWallet]) {
      // fund with 1 ETH and 2000 USDC.e
      await fundAccount(tokens.weth, wallet.address, ParseWETH(1.0), config)
      await fundAccount(tokens.usdc, wallet.address, ParseUSDC(2000), config)
    }

    await mmWallet.depositInOrderBook(orderBook.address, tokens.weth.address, ParseWETH(1.0))
    await mmWallet.depositInOrderBook(orderBook.address, tokens.usdc.address, ParseUSDC(2000))
  }

  return {
    orderBook,
    config,
    factory,
    mmWallet,
    swapWallet,
    ...tokens,
  }
}
