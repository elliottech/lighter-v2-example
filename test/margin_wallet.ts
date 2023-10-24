import {ethers} from 'hardhat'
import {expect} from 'chai'
import {
  deployTokens,
  ParseUSDC,
  getAAVEPoolAt,
  reset,
  deployMarginWallet,
  fundAccount,
  ParseWETH,
  getFactoryAt,
  getOrderBookAt,
} from './shared'
import {getLighterConfig} from '../sdk'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {IERC20Metadata, IOrderBook, MarginWallet} from '../typechain-types'
import {IAToken} from '@aave/core-v3/dist/types/types'

describe('Margin wallet', async () => {
  let signer: SignerWithAddress
  let wallet: MarginWallet
  let orderBook: IOrderBook

  let vusdc: IERC20Metadata, ausdc: IAToken, usdc: IERC20Metadata
  let vweth: IERC20Metadata, aweth: IAToken, weth: IERC20Metadata

  beforeEach(async function () {
    await reset()
    ;[signer] = await ethers.getSigners()
    const config = await getLighterConfig()
    const factory = await getFactoryAt(config.Factory)
    orderBook = await getOrderBookAt(factory.getOrderBookFromId(0))
    const pool = await getAAVEPoolAt(config.AAVEPool!)
    wallet = await deployMarginWallet(factory, pool)
    ;({vusdc, ausdc, usdc, vweth, aweth, weth} = await deployTokens())

    await fundAccount(usdc, signer, ParseUSDC('100000'))
    await fundAccount(weth, signer, ParseWETH('100'))

    await usdc.approve(wallet.address, ParseUSDC('100000'))
    await weth.approve(wallet.address, ParseWETH('100'))
  })

  it('it deposits and withdraws', async () => {
    const amount = ParseUSDC(100)

    // deposit into wallet
    let tx = await wallet.deposit(usdc.address, amount)
    await expect(tx).to.changeTokenBalance(ausdc, wallet.address, amount)
    await expect(tx).to.changeTokenBalance(usdc, signer.address, -amount)
    await expect(tx).to.changeTokenBalance(usdc, wallet.address, 0)

    // withdraw from wallet
    tx = await wallet.withdraw(usdc.address, amount)
    await expect(tx).to.changeTokenBalance(ausdc, wallet.address, -amount)
    await expect(tx).to.changeTokenBalance(usdc, signer.address, amount)
    await expect(tx).to.changeTokenBalance(usdc, wallet.address, 0)
  })

  it('swaps USDC for ETH with leverage', async () => {
    // deposit 600 USDC.e
    const amount = ParseUSDC(600)
    await wallet.deposit(usdc.address, amount)

    // buy ETH @ 2100
    const tx = await wallet.swapExactInput(orderBook.address, false, ParseUSDC(1000), ParseWETH('0.47619'))

    // token is used as collateral
    await expect(tx).to.changeTokenBalance(aweth, wallet.address, ParseWETH('0.47619'))
    // variable USDC debt was added to the account to cover the difference
    await expect(tx).to.changeTokenBalance(vusdc, wallet.address, ParseUSDC('399.998999'))
    // deposited USDC was consumed since it doesn't make sense to take debt while having deposits
    await expect(tx).to.changeTokenBalance(ausdc, wallet.address, ParseUSDC('-600'))
  })

  it('long ETH with 3X leverage', async () => {
    // deposit 100 USDC.e
    const amount = ParseUSDC(100)
    await wallet.deposit(usdc.address, amount)

    // buy ETH @ 2100
    await wallet.swapExactInput(orderBook.address, false, ParseUSDC(300), 0)

    expect(await vusdc.balanceOf(wallet.address)).to.approximately(ParseUSDC(200), 500)
    expect(await aweth.balanceOf(wallet.address)).to.approximately(ParseWETH('0.142857'), 100)
  })

  it('short ETH with 3X leverage', async () => {
    // deposit 100 USDC.e
    const amount = ParseUSDC(100)
    await wallet.deposit(usdc.address, amount)

    // sell ETH @ 1900
    await wallet.swapExactOutput(orderBook.address, true, ParseUSDC(300), ParseWETH('1.0'))

    expect(await ausdc.balanceOf(wallet.address)).to.approximately(ParseUSDC(400), 500)
    expect(await vweth.balanceOf(wallet.address)).to.approximately(ParseWETH(0.157895), 100)
  })

  it('repays debt when doing opposite trade', async () => {
    // deposit 600 USDC.e
    const amount = ParseUSDC(600)
    await wallet.deposit(usdc.address, amount)

    // buy ETH @ 2100
    await wallet.swapExactInput(orderBook.address, false, ParseUSDC(1000), ParseWETH('0.47619'))

    // sell ETH @ 1900
    const tx = await wallet.swapExactOutput(orderBook.address, true, ParseUSDC(400), ParseWETH('1'))

    // deposit was used to pay for the transfer,
    await expect(tx).to.changeTokenBalance(aweth, wallet.address, ParseWETH('-0.210526999878157412'))
    // variable USDC debt was paid
    await expect(tx).to.changeTokenBalance(vusdc, wallet.address, ParseUSDC('-399.998999'))
    // extra tokens which were received were deposited in AAVE
    await expect(tx).to.changeTokenBalance(ausdc, wallet.address, 2300)
    // no weth debt was taken
    await expect(tx).to.changeTokenBalance(vweth, wallet.address, 0)
  })

  it('repays debt when tokens are deposited', async () => {
    // deposit 600 USDC.e
    const amount = ParseUSDC(600)
    await wallet.deposit(usdc.address, amount)

    // buy ETH @ 2100
    await wallet.swapExactInput(orderBook.address, false, ParseUSDC(1000), ParseWETH('0.47619'))

    // deposit another 600
    const tx = await wallet.deposit(usdc.address, amount)

    // debt was repaid
    await expect(tx).to.changeTokenBalance(vusdc, wallet.address, ParseUSDC('-399.998999'))
    // the extra $200 were deposited into AAVE
    await expect(tx).to.changeTokenBalance(ausdc, wallet.address, ParseUSDC('200.001'))
  })

  it('rescues tokens', async () => {
    const amount = ParseUSDC(100)
    await usdc.transfer(wallet.address, amount)

    const tx = wallet.rescue(usdc.address, amount)

    await expect(tx).to.changeTokenBalance(usdc, wallet.address, ParseUSDC('-100'))
    await expect(tx).to.changeTokenBalance(usdc, signer.address, ParseUSDC('100'))
  })
})
