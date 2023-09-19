import {IERC20} from '../typechain-types'
import {ethers} from 'hardhat'
import {expect} from 'chai'
import {parseEther, parseUnits} from 'ethers/lib/utils'
import {Token, getLighterConfig, LighterConfig} from '../config'
import {BigNumber} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {getTokenAt, reset} from './shared'

// send specified amount to recipient
// the funds are being send from the configured Vault address for that token, since tokens are not mintable
export async function fundAccount(
  token: IERC20,
  recipient: string | SignerWithAddress,
  amount: BigNumber,
  config?: LighterConfig
) {
  if (config == null) {
    config = await getLighterConfig()
  }

  // get vault from token address
  let vaultAddress = null
  for (const s in config.Tokens) {
    if (config.Tokens[s as Token]! == token.address) {
      vaultAddress = config.Vault[s as Token]!
      break
    }
  }
  if (vaultAddress == null) {
    throw `token ${token.address} is not used`
  }
  const vault = await ethers.getImpersonatedSigner(vaultAddress)

  const recipientAddress = typeof recipient == 'string' ? recipient : recipient.address
  return token.connect(vault).transfer(recipientAddress, amount)
}

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
