import {ethers} from 'hardhat'
import {expect} from 'chai'
import {deployTokens, ParseUSDC, getAAVEPoolAt, reset, deployMarginWallet, fundAccount} from './shared'
import {getLighterConfig} from '../config'

describe('Margin wallet', async () => {
  beforeEach(async function () {
    await reset()
  })

  it('it deposits and withdraws', async () => {
    const [signer] = await ethers.getSigners()
    const config = await getLighterConfig()
    const pool = await getAAVEPoolAt(config.AAVEPool)
    const wallet = await deployMarginWallet(pool)

    const {ausdc, usdc} = await deployTokens()
    const amount = ParseUSDC(100)
    await fundAccount(usdc, signer, amount)

    await usdc.approve(wallet.address, amount)

    // deposit into wallet
    await wallet.deposit(usdc.address, amount)
    expect(await ausdc.balanceOf(wallet.address)).to.equal(amount)
    expect(await usdc.balanceOf(signer.address)).to.equal(0)
    expect(await usdc.balanceOf(wallet.address)).to.equal(0)

    // withdraw from wallet
    await wallet.withdraw(usdc.address, amount)
    expect(await ausdc.balanceOf(wallet.address)).to.lt(10) // use < 10 since there might be some interest accrued
    expect(await usdc.balanceOf(signer.address)).to.equal(amount)
    expect(await usdc.balanceOf(wallet.address)).to.equal(0)
  })
})
