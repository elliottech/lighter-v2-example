import {IERC20Metadata} from '../typechain-types'
import {ethers} from 'hardhat'
import {expect} from 'chai'
import {parseEther, parseUnits} from 'ethers/lib/utils'
import {getLighterConfig} from '../config/config-helper'
import {Token} from 'config/types'

export async function getTokenAt(address: string): Promise<IERC20Metadata> {
  const [signer] = await ethers.getSigners()
  return (await ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

describe('token', async () => {
  let WETHAddress: string, USDCeAddress: string, vaultAddress: string

  beforeEach(async () => {
    const lighterConfigData = await getLighterConfig()
    WETHAddress = lighterConfigData.Tokens[Token.WETH] as string
    USDCeAddress = lighterConfigData.Tokens[Token.USDC] as string
    vaultAddress = lighterConfigData.VaultAddress as string
  })

  it('forks WETH correctly', async () => {
    const signer = await ethers.getImpersonatedSigner(vaultAddress)
    const weth = await getTokenAt(WETHAddress)

    // token is configured successfully
    expect(await weth.symbol()).to.equal('WETH')
    expect(await weth.balanceOf(signer.address)).to.be.greaterThan(parseEther('2.0'))

    // user is impersonated successfully and capable to send 1 WETH
    const tx = await weth.connect(signer).transfer('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', parseEther('1.0'))
    await expect(tx).to.changeTokenBalance(weth, signer, parseEther('-1.0'))
  })
  it('forks USDC.e correctly', async () => {
    const signer = await ethers.getImpersonatedSigner(vaultAddress)
    const usdc = await getTokenAt(USDCeAddress)

    // token is configured successfully
    expect(await usdc.symbol()).to.equal('USDC')
    expect(await usdc.balanceOf(signer.address)).to.be.greaterThan(parseUnits('4000.0', 6))

    // user is impersonated successfully and capable to send 1 USDC.e
    const tx = await usdc.connect(signer).transfer('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', parseUnits('1.0', 6))
    await expect(tx).to.changeTokenBalance(usdc, signer, parseUnits('-1.0', 6))
  })
})
