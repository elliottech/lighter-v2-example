import * as IAToken from '@aave/core-v3/artifacts/contracts/interfaces/IAToken.sol/IAToken.json'
import * as AAVEPoolV3 from '@aave/core-v3/artifacts/contracts/protocol/pool/Pool.sol/Pool.json'
import {AToken, Pool} from '@aave/core-v3/dist/types/types'
import {ethers} from 'hardhat'
import {Contract} from 'ethers'
import {getLighterConfig} from '../../config'
import {IERC20Metadata} from '../../typechain-types'

export async function getAAVEPoolAt(address: string): Promise<Pool> {
  const [signer] = await ethers.getSigners()
  return new Contract(address, AAVEPoolV3.abi, signer) as Pool
}

export async function getTokenAt(address: string): Promise<IERC20Metadata> {
  const [signer] = await ethers.getSigners()
  return (await ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

export async function getATokenAt(address: string) {
  const [signer] = await ethers.getSigners()
  return new Contract(address, IAToken.abi, signer) as AToken
}

export async function deployTokens() {
  const config = await getLighterConfig()
  return {
    weth: await getTokenAt(config.Tokens['WETH']!),
    aweth: await getATokenAt(config.Tokens['aArbWETH']!),
    vweth: await getTokenAt(config.Tokens['vArbWETH']!),

    usdc: await getTokenAt(config.Tokens['USDC']!),
    ausdc: await getATokenAt(config.Tokens['aArbUSDC']!),
    vusdc: await getTokenAt(config.Tokens['vArbUSDC']!),
  }
}
