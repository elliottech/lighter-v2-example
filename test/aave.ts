import {ethers} from 'hardhat'
import {BigNumber} from 'ethers'
import {expect} from 'chai'
import {fundAccount} from './token'
import {deployTokens, getAAVEPoolAt, getATokenAt, ParseUSDC, ParseWETH, reset} from './shared'
import {getLighterConfig} from '../config'

export const AAVEStableRate = BigNumber.from(1)
export const AAVEVariableRate = BigNumber.from(2)

describe('AAVE', async () => {
  beforeEach(async function () {
    await reset()
  })

  it('forks aWETH correctly', async () => {
    const config = await getLighterConfig()
    const token = await getATokenAt(config.Tokens['aArbWETH']!)
    const vault = config.Vault['aArbWETH']!
    const amount = ParseWETH('200.0')

    // token is configured successfully
    expect(await token.UNDERLYING_ASSET_ADDRESS()).to.equal(config.Tokens['WETH']!)

    // vault has balance
    expect(await token.balanceOf(vault)).to.be.greaterThan(amount)

    const [signer] = await ethers.getSigners()

    // user is impersonated successfully and capable to send money
    await fundAccount(token, signer, amount)
    expect(await token.balanceOf(signer.address)).to.equal(amount)
  })
  it('forks aUSDC.e correctly', async () => {
    const config = await getLighterConfig()
    const token = await getATokenAt(config.Tokens['aArbUSDC']!)
    const vault = config.Vault['aArbUSDC']!
    const amount = ParseUSDC('200000.0')

    // token is configured successfully
    expect(await token.UNDERLYING_ASSET_ADDRESS()).to.equal(config.Tokens['USDC'])

    // vault has balance
    expect(await token.balanceOf(vault)).to.be.greaterThan(amount)

    const [signer] = await ethers.getSigners()

    // user is impersonated successfully and capable to send money
    await fundAccount(token, signer, amount)
    expect(await token.balanceOf(signer.address)).to.equal(amount)
  })

  it('it can deposit USDC.e', async () => {
    const config = await getLighterConfig()
    const pool = await getAAVEPoolAt(config.AAVEPool)
    const [signer] = await ethers.getSigners()

    const {ausdc, usdc} = await deployTokens()
    const amount = ParseUSDC(100)
    await fundAccount(usdc, signer, amount)

    await usdc.approve(pool.address, amount)

    await pool.deposit(usdc.address, amount, signer.address, 0)
    expect(await ausdc.balanceOf(signer.address)).to.equal(amount)
  })
  it('it can deposit WETH', async () => {
    const config = await getLighterConfig()
    const pool = await getAAVEPoolAt(config.AAVEPool)
    const [signer] = await ethers.getSigners()

    const {aweth, weth} = await deployTokens()
    const amount = ParseWETH(1)
    await fundAccount(weth, signer, amount)

    await weth.approve(pool.address, amount)

    await pool.deposit(weth.address, amount, signer.address, 0)
    expect(await aweth.balanceOf(signer.address)).to.equal(amount)
  })
  it('it can borrow USDC.e', async () => {
    const config = await getLighterConfig()
    const pool = await getAAVEPoolAt(config.AAVEPool)
    const [signer] = await ethers.getSigners()
    const {vusdc, usdc, weth} = await deployTokens()

    // deposit 1 ETH
    const ethAmount = ParseWETH(1)
    await fundAccount(weth, signer, ethAmount)
    await weth.approve(pool.address, ethAmount)
    await pool.deposit(weth.address, ethAmount, signer.address, 0)

    // borrow 1K USD
    const usdcAmount = ParseUSDC(1000)
    await pool.borrow(usdc.address, usdcAmount, AAVEVariableRate, 0, signer.address)
    expect(await usdc.balanceOf(signer.address)).to.equal(usdcAmount)
    expect(await vusdc.balanceOf(signer.address)).to.equal(usdcAmount)
  })
})
