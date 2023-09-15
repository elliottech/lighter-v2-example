import {task} from 'hardhat/config'
import {formatUnits, parseUnits} from 'ethers/lib/utils'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {IERC20Metadata} from '../typechain-types'

export async function getTokenAt(address: string, hre: HardhatRuntimeEnvironment): Promise<IERC20Metadata> {
  const [signer] = await hre.ethers.getSigners()
  return (await hre.ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

task('token.transfer')
  .addParam('token', 'address of ERC20 token')
  .addParam('to', 'address of recipient')
  .addParam('amount', 'amount of token (without decimals)')
  .setAction(async ({token: tokenAddress, to, amount}, hre) => {
    const token = await getTokenAt(tokenAddress, hre)

    const decimals = await token.decimals()
    await token.transfer(to, parseUnits(amount, decimals))
    console.log(`transferred to ${to} ${amount}`)
  })

task('token.balance')
  .addParam('token', 'address of ERC20 token')
  .addParam('address', 'address of user', '')
  .setDescription('displays tokens for a specific address')
  .setAction(async ({token: tokenAddress, address}, hre) => {
    const token = await getTokenAt(tokenAddress, hre)

    if (address == '') {
      const [signer] = await hre.ethers.getSigners()
      address = signer.address
    }

    const decimals = await token.decimals()
    const balance = await token.balanceOf(address)
    console.log(`address ${address} ${formatUnits(balance, decimals)}`)
  })
