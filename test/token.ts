import {ethers} from 'hardhat'
import {expect} from 'chai'
import {parseEther, parseUnits} from 'ethers/lib/utils'
import {getLighterConfig} from '../sdk'
import {fundAccount, getTokenAt, reset} from './shared'

describe('token', async () => {
  beforeEach(async function () {
    await reset()
  })

  it('forks WETH correctly', async () => {
    const config = await getLighterConfig()
    const token = await getTokenAt(config.Tokens['WETH']!)
    const vault = config.Vault['WETH']!
    const amount = parseEther('200.0')

    // token is configured successfully
    expect(await token.symbol()).to.equal('WETH')

    // vault has balance
    expect(await token.balanceOf(vault)).to.be.greaterThan(amount)

    const [signer] = await ethers.getSigners()

    // user is impersonated successfully and capable to send money
    await fundAccount(token, signer, amount)
    expect(await token.balanceOf(signer.address)).to.equal(amount)
  })

  it('forks USDC.e correctly', async () => {
    const config = await getLighterConfig()
    const token = await getTokenAt(config.Tokens['USDC']!)
    const vault = config.Vault['USDC']!
    const amount = parseUnits('200000.0', 6)

    // token is configured successfully
    expect(await token.symbol()).to.equal('USDC')

    // vault has balance
    expect(await token.balanceOf(vault)).to.be.greaterThan(amount)

    const [signer] = await ethers.getSigners()

    // user is impersonated successfully and capable to send money
    await fundAccount(token, signer, amount)
    expect(await token.balanceOf(signer.address)).to.equal(amount)
  })
})
