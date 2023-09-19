import {task} from 'hardhat/config'
import {formatUnits, parseUnits} from 'ethers/lib/utils'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {IERC20Metadata} from '../typechain-types'
import {getLighterConfig, Token} from '../config'

export async function getTokenAt(symbol: string, hre: HardhatRuntimeEnvironment): Promise<IERC20Metadata> {
  const [signer] = await hre.ethers.getSigners()
  const config = await getLighterConfig()
  const address = config.Tokens[symbol as Token]!
  return (await hre.ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

task('token.transfer')
  .addParam('symbol', 'symbol of the ERC20 token')
  .addParam('to', 'address of recipient')
  .addParam('amount', 'amount of token (without decimals)')
  .setAction(async ({symbol, to, amount}, hre) => {
    const token = await getTokenAt(symbol, hre)

    const decimals = await token.decimals()
    await token.transfer(to, parseUnits(amount, decimals))
    console.log(`transferred to ${to} ${amount}`)
  })

task('token.balance')
  .addParam('symbol', 'symbol of the ERC20 token')
  .addParam('address', 'address of user', '')
  .setDescription('displays tokens for a specific address')
  .setAction(async ({symbol, address}, hre) => {
    const token = await getTokenAt(symbol, hre)

    if (address == '') {
      const [signer] = await hre.ethers.getSigners()
      address = signer.address
    }

    const decimals = await token.decimals()
    const balance = await token.balanceOf(address)
    console.log(`address ${address} ${formatUnits(balance, decimals)}`)
  })
