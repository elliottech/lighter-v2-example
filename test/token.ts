import {IERC20Metadata} from '../typechain-types'
import {ethers} from 'hardhat'
import {expect} from 'chai'
import {parseEther, parseUnits} from 'ethers/lib/utils'

export async function getTokenAt(address: string): Promise<IERC20Metadata> {
  const [signer] = await ethers.getSigners()
  return (await ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

const WETHAddress = '0x4d541F0B8039643783492F9865C7f7de4F54eB5f'
const USDCeAddress = '0xcC4a8FA63cE5C6a7f4A7A3D2EbCb738ddcD31209'
const userWithFunds = '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146'

describe('token', async () => {
  it('forks WETH correctly', async () => {
    const signer = await ethers.getImpersonatedSigner(userWithFunds)
    const weth = await getTokenAt(WETHAddress)

    // token is configured successfully
    expect(await weth.symbol()).to.equal('WETH')
    expect(await weth.balanceOf(signer.address)).to.be.greaterThan(parseEther('2.0'))

    // user is impersonated successfully and capable to send 1 WETH
    const tx = await weth.connect(signer).transfer('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', parseEther('1.0'))
    await expect(tx).to.changeTokenBalance(weth, signer, parseEther('-1.0'))
  })
  it('forks USDC.e correctly', async () => {
    const signer = await ethers.getImpersonatedSigner(userWithFunds)
    const usdc = await getTokenAt(USDCeAddress)

    // token is configured successfully
    expect(await usdc.symbol()).to.equal('USDC')
    expect(await usdc.balanceOf(signer.address)).to.be.greaterThan(parseUnits('4000.0', 6))

    // user is impersonated successfully and capable to send 1 USDC.e
    const tx = await usdc.connect(signer).transfer('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', parseUnits('1.0', 6))
    await expect(tx).to.changeTokenBalance(usdc, signer, parseUnits('-1.0', 6))
  })
})
