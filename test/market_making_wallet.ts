import {ethers} from 'hardhat'
import {IOrderBook} from '../typechain-types'
import {ParseUSDC, ParseWETH, reset, deployContracts, fundAccount} from './shared'
import {expect} from 'chai'
import {BigNumberish} from 'ethers'

async function expectOrderBook(orderBook: IOrderBook, asks: BigNumberish[], bids: BigNumberish[]) {
  const [, ids_ask] = await orderBook.getPaginatedOrders(0, true, asks.length)
  expect(ids_ask).to.eql(asks)
  const [, ids_bid] = await orderBook.getPaginatedOrders(0, false, bids.length)
  expect(ids_bid).to.eql(bids)
}

describe('Market Making wallet', async () => {
  beforeEach(async function () {
    await reset()
  })

  it('it creates ask order', async () => {
    const {mmWallet: wallet, orderBook} = await deployContracts()
    const amount = ParseWETH(1)
    const price = ParseUSDC(2000)

    await wallet.createLimitOrder(orderBook.address, amount, price, true, 0)
    await expectOrderBook(orderBook, [9, 4, 5, 0], [7, 6, 8, 0])

    // getLimitOrder does not return amounts, but number of ticks (amount0Base and priceBase)
    // to get the returned values as amounts, you need to multiply them by sizeTick and priceTick
    // these values are fixed for each order book and will not change after the contract is deployed.
    const sizeTick = await orderBook.sizeTick()
    const priceTick = await orderBook.priceTick()
    const order = await orderBook.getLimitOrder(true, 9)
    expect(order.amount0Base.mul(sizeTick)).to.equal(amount)
    expect(order.priceBase.mul(priceTick)).to.equal(price)
  })
  it('it creates bid order', async () => {
    const {mmWallet: wallet, orderBook} = await deployContracts()
    const amount = ParseWETH(1)
    const price = ParseUSDC(2000)

    await wallet.createLimitOrder(orderBook.address, amount, price, false, 0)
    await expectOrderBook(orderBook, [4, 5, 0], [9, 7, 6, 8, 0])

    // getLimitOrder does not return amounts, but number of ticks (amount0Base and priceBase)
    // to get the returned values as amounts, you need to multiply them by sizeTick and priceTick
    // these values are fixed for each order book and will not change after the contract is deployed.
    const sizeTick = await orderBook.sizeTick()
    const priceTick = await orderBook.priceTick()
    const order = await orderBook.getLimitOrder(false, 9)
    expect(order.amount0Base.mul(sizeTick)).to.equal(amount)
    expect(order.priceBase.mul(priceTick)).to.equal(price)
  })
  it('cancels order', async () => {
    const {mmWallet: wallet, orderBook} = await deployContracts()
    const amount = ParseWETH(1)
    const price = ParseUSDC(2000)

    await wallet.createLimitOrder(orderBook.address, amount, price, false, 0)
    await expectOrderBook(orderBook, [4, 5, 0], [9, 7, 6, 8, 0])

    await wallet.cancelLimitOrder(orderBook.address, 9)
    await expectOrderBook(orderBook, [4, 5, 0], [7, 6, 8, 0])
  })
  it('cancels all orders', async () => {
    const {mmWallet: wallet, orderBook} = await deployContracts()
    const amount = ParseWETH(0.1)
    const price = ParseUSDC(2000)

    await wallet.createLimitOrder(orderBook.address, amount, price, false, 0)
    await wallet.createLimitOrder(orderBook.address, amount, price, false, 0)
    await wallet.createLimitOrder(orderBook.address, amount, price, false, 0)
    await wallet.createLimitOrder(orderBook.address, amount, price, false, 0)
    await expectOrderBook(orderBook, [4, 5, 0], [9, 10, 11, 12, 7, 6, 8, 0])

    await wallet.cancelAllLimitOrders(orderBook.address)
    await expectOrderBook(orderBook, [4, 5, 0], [7, 6, 8, 0])
  })
  it('gets all orders', async () => {
    const {mmWallet: wallet, orderBook} = await deployContracts()
    const orders = await wallet.getLimitOrders(orderBook.address)
    expect(orders.length).to.equal(5)

    expect(orders[0].isAsk).to.equal(true)
    expect(orders[1].isAsk).to.equal(true)
    expect(orders[2].isAsk).to.equal(false)
    expect(orders[3].isAsk).to.equal(false)
    expect(orders[4].isAsk).to.equal(false)

    expect(orders[0].id).to.equal(4)
    expect(orders[1].id).to.equal(5)
    expect(orders[2].id).to.equal(7)
    expect(orders[3].id).to.equal(6)
    expect(orders[4].id).to.equal(8)

    // the price returned has the same amount of decimals as Token1 (USDC.e in this case)
    expect(orders[0].price).to.equal(ParseUSDC(2100))
    expect(orders[1].price).to.equal(ParseUSDC(2300))
    expect(orders[2].price).to.equal(ParseUSDC(1900))
    expect(orders[3].price).to.equal(ParseUSDC(1600))
    expect(orders[4].price).to.equal(ParseUSDC(1500))

    // the amount0 returned has the same amount of decimals as Token0 (WETH in this case)
    expect(orders[0].amount0).to.equal(ParseWETH(0.5))
    expect(orders[1].amount0).to.equal(ParseWETH(0.3))
    expect(orders[2].amount0).to.equal(ParseWETH(0.5))
    expect(orders[3].amount0).to.equal(ParseWETH(0.3))
    expect(orders[4].amount0).to.equal(ParseWETH(0.2))
  })

  it('can withdraw tokens', async () => {
    const {mmWallet: wallet, weth, config} = await deployContracts(false)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)

    await wallet.withdraw(weth.address, amount)

    const [signer] = await ethers.getSigners()
    expect(await weth.balanceOf(signer.address)).to.equal(amount)
  })
  it('can deposit WETH in order book', async () => {
    const {mmWallet: wallet, weth, config, orderBook} = await deployContracts(false)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)
    await wallet.depositInOrderBook(orderBook.address, weth.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(amount)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(0)
  })
  it('can deposit USDC in order book', async () => {
    const {mmWallet: wallet, usdc, config, orderBook} = await deployContracts(false)
    const amount = ParseUSDC(2000)
    await fundAccount(usdc, wallet.address, amount, config)
    await wallet.depositInOrderBook(orderBook.address, usdc.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(0)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(amount)
  })
  it('can claim WETH from order book', async () => {
    const {mmWallet: wallet, weth, config, orderBook} = await deployContracts(false)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)

    await wallet.depositInOrderBook(orderBook.address, weth.address, amount)
    await wallet.claimFromOrderBook(orderBook.address, weth.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(0)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(0)
    expect(await weth.balanceOf(wallet.address)).to.equal(amount)
  })
  it('can claim USDC from order book', async () => {
    const {mmWallet: wallet, usdc, config, orderBook} = await deployContracts(false)
    const amount = ParseUSDC(2000)
    await fundAccount(usdc, wallet.address, amount, config)

    await wallet.depositInOrderBook(orderBook.address, usdc.address, amount)
    await wallet.claimFromOrderBook(orderBook.address, usdc.address, amount)

    expect(await orderBook.claimableToken0Balance(wallet.address)).to.equal(0)
    expect(await orderBook.claimableToken1Balance(wallet.address)).to.equal(0)
    expect(await usdc.balanceOf(wallet.address)).to.equal(amount)
  })
})
