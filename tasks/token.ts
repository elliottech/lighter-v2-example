import {task} from 'hardhat/config'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {formatUnits, parseUnits} from 'ethers/lib/utils'
import {IERC20Metadata} from '../typechain-types'
import {LighterConfig, Token, getLighterConfig} from '../sdk'

export async function getTokenAt(
  config: LighterConfig,
  symbol: string,
  hre: HardhatRuntimeEnvironment
): Promise<IERC20Metadata> {
  const [signer] = await hre.ethers.getSigners()
  const address = config.Tokens[symbol as Token]!
  return (await hre.ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

task('token.transfer')
  .addParam('symbol', 'symbol of the ERC20 token')
  .addParam('to', 'address of recipient')
  .addParam('amount', 'amount of token (without decimals)')
  .setAction(async ({symbol, to, amount}, hre) => {
    const config = await getLighterConfig()
    const token = await getTokenAt(config, symbol, hre)

    const decimals = await token.decimals()
    await token.transfer(to, parseUnits(amount, decimals))
    console.log(`transferred to ${to} ${amount}`)
  })

task('token.balance')
  .addParam('symbol', 'symbol of the ERC20 token')
  .addParam('address', 'address of user', '')
  .setDescription('displays tokens for a specific address')
  .setAction(async ({symbol, address}, hre) => {
    const config = await getLighterConfig()
    const token = await getTokenAt(config, symbol, hre)

    if (address == '') {
      const [signer] = await hre.ethers.getSigners()
      address = signer.address
    }

    const decimals = await token.decimals()
    const balance = await token.balanceOf(address)
    console.log(`address ${address} ${formatUnits(balance, decimals)}`)
  })

task('token.approveRouter')
  .addParam('symbol', 'symbol of the ERC20 token')
  .addParam('amount', 'amount of token (without decimals)')
  .setAction(async ({symbol, amount}, hre) => {
    const config = await getLighterConfig()
    const token = await getTokenAt(config, symbol, hre)

    const router = config.Router

    const decimals = await token.decimals()
    await token.approve(router, parseUnits(amount, decimals))
    console.log(`approved ${amount} to router`)
  })
