import {ethers, network} from 'hardhat'
import {IFactory, IOrderBook, MarketMakingWallet} from '../typechain-types'
import {deployTokens, ParseUSDC, getFactoryAt, ParseWETH, getOrderBookAt, resetTestnet} from './shared'
import {fundAccount} from './token'
import {getLighterConfig} from '../config'
import {expect} from 'chai'
import {BigNumberish} from 'ethers'

async function deployMarketMakingWallet(factory: IFactory) {
  const contractFactory = await ethers.getContractFactory('MarketMakingWallet')
  return (await contractFactory.deploy(factory.address)) as MarketMakingWallet
}

async function expectOrderBook(orderBook: IOrderBook, asks: BigNumberish[], bids: BigNumberish[]) {
  const [, ids_ask] = await orderBook.getPaginatedOrders(0, true, asks.length)
  expect(ids_ask).to.eql(asks)
  const [, ids_bid] = await orderBook.getPaginatedOrders(0, false, bids.length)
  expect(ids_bid).to.eql(bids)
}

describe('Swap wallet', async () => {
  beforeEach(async function () {
    // TODO: Use mainnet fork when contracts are deployed
    await resetTestnet()
  })

  async function deployContracts(fundWallet = true) {
    const config = await getLighterConfig(true)
    const factory = await getFactoryAt(config.Factory)
    const orderBook = await getOrderBookAt(factory.getOrderBookFromId(0))
    const wallet = await deployMarketMakingWallet(factory)
    const tokens = await deployTokens(config)

    if (fundWallet) {
      // lock 1 ETH and 2000 USDC.e in the order book
      await fundAccount(tokens.weth, wallet.address, ParseWETH(1.0), config)
      await wallet.depositInOrderBook(0, tokens.weth.address, ParseWETH(1.0))

      await fundAccount(tokens.usdc, wallet.address, ParseUSDC(2000), config)
      await wallet.depositInOrderBook(0, tokens.usdc.address, ParseUSDC(2000))
    }

    return {
      orderBook,
      config,
      factory,
      wallet,
      ...tokens,
    }
  }

  it('it creates ask order', async () => {
    const {wallet, orderBook} = await deployContracts()
    const amount = ParseWETH(1)
    const price = ParseUSDC(2000)

    await wallet.createLimitOrder(0, 1, [amount], [price], [true], [0])
    await expectOrderBook(orderBook, [37, 35, 0], [36, 29, 31, 30, 0])

    // getLimitOrder does not return amounts, but number of ticks (amount0Base and priceBase)
    // to get the returned values as amounts, you need to multiply them by sizeTick and priceTick
    // these values are fixed for each order book and will not change after the contract is deployed.
    const sizeTick = await orderBook.sizeTick()
    const priceTick = await orderBook.priceTick()
    const order = await orderBook.getLimitOrder(true, 37)
    expect(order.amount0Base.mul(sizeTick)).to.equal(amount)
    expect(order.priceBase.mul(priceTick)).to.equal(price)
  })
  it('it creates bid order', async () => {
    const {wallet, orderBook} = await deployContracts()
    const amount = ParseWETH(1)
    const price = ParseUSDC(2000)

    await wallet.createLimitOrder(0, 1, [amount], [price], [false], [0])
    await expectOrderBook(orderBook, [35, 0], [37, 36, 29, 31, 30, 0])

    // getLimitOrder does not return amounts, but number of ticks (amount0Base and priceBase)
    // to get the returned values as amounts, you need to multiply them by sizeTick and priceTick
    // these values are fixed for each order book and will not change after the contract is deployed.
    const sizeTick = await orderBook.sizeTick()
    const priceTick = await orderBook.priceTick()
    const order = await orderBook.getLimitOrder(false, 37)
    expect(order.amount0Base.mul(sizeTick)).to.equal(amount)
    expect(order.priceBase.mul(priceTick)).to.equal(price)
  })
  it('cancels orders', async () => {
    const {wallet, orderBook} = await deployContracts()
    const amount = ParseWETH(1)
    const price = ParseUSDC(2000)

    await wallet.createLimitOrder(0, 1, [amount], [price], [false], [0])
    await expectOrderBook(orderBook, [35, 0], [37, 36, 29, 31, 30, 0])

    await wallet.cancelLimitOrder(0, 1, [37])
    await expectOrderBook(orderBook, [35, 0], [36, 29, 31, 30, 0])
  })

  it('can withdraw tokens', async () => {
    const {wallet, weth, config} = await deployContracts(false)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)

    await wallet.withdraw(weth.address, amount)

    const [signer] = await ethers.getSigners()
    expect(await weth.balanceOf(signer.address)).to.equal(amount)
  })
  it('can deposit WETH in order book', async () => {
    const {wallet, weth, config, orderBook} = await deployContracts(false)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)
    await wallet.depositInOrderBook(0, weth.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(amount)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(0)
  })
  it('can deposit USDC in order book', async () => {
    const {wallet, usdc, config, orderBook} = await deployContracts(false)
    const amount = ParseUSDC(2000)
    await fundAccount(usdc, wallet.address, amount, config)
    await wallet.depositInOrderBook(0, usdc.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(0)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(amount)
  })
  it('can claim WETH from order book', async () => {
    const {wallet, weth, config, orderBook} = await deployContracts(false)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)

    await wallet.depositInOrderBook(0, weth.address, amount)
    await wallet.claimFromOrderBook(0, weth.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(0)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(0)
    expect(await weth.balanceOf(wallet.address)).to.equal(amount)
  })
  it('can claim USDC from order book', async () => {
    const {wallet, usdc, config, orderBook} = await deployContracts(false)
    const amount = ParseUSDC(2000)
    await fundAccount(usdc, wallet.address, amount, config)

    await wallet.depositInOrderBook(0, usdc.address, amount)
    await wallet.claimFromOrderBook(0, usdc.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(0)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(0)
    expect(await usdc.balanceOf(wallet.address)).to.equal(amount)
  })
})
