import {ethers} from 'hardhat'
import {ParseUSDC, ParseWETH, reset, deployContracts} from './shared'
import {expect} from 'chai'

describe('Swap wallet', async () => {
  beforeEach(async function () {
    await reset()
  })

  it('it swaps exact input USDC for WETH', async () => {
    const {swapWallet: wallet, orderBook} = await deployContracts(true)

    await wallet.swapExactInput(orderBook.address, false, ParseUSDC(1000), ParseWETH('0.45'), wallet.address)
  })
  it('it swaps exact input WETH for USDC', async () => {
    const {swapWallet: wallet, orderBook} = await deployContracts(true)

    await wallet.swapExactInput(orderBook.address, true, ParseWETH(0.5), ParseUSDC(900), wallet.address)
  })
  it('it swaps exact output USDC for WETH', async () => {
    const {swapWallet: wallet, orderBook} = await deployContracts(true)

    await wallet.swapExactOutput(orderBook.address, false, ParseWETH(0.5), ParseUSDC(1100), wallet.address)
  })
  it('it swaps exact output WETH for USDC', async () => {
    const {swapWallet: wallet, orderBook} = await deployContracts(true)

    await wallet.swapExactOutput(orderBook.address, true, ParseUSDC(1000), ParseWETH('0.55'), wallet.address)
  })

  it('can withdraw tokens', async () => {
    const {swapWallet: wallet, weth} = await deployContracts(true)

    await wallet.withdraw(weth.address, ParseWETH(1.0))

    const [signer] = await ethers.getSigners()
    expect(await weth.balanceOf(signer.address)).to.equal(ParseWETH(1.0))
  })
})
