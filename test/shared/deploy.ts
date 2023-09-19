import * as IATokenABI from '@aave/core-v3/artifacts/contracts/interfaces/IAToken.sol/IAToken.json'
import * as AAVEPoolV3 from '@aave/core-v3/artifacts/contracts/protocol/pool/Pool.sol/Pool.json'
import {IAToken, IPool} from '@aave/core-v3/dist/types/types'
import {ethers} from 'hardhat'
import {Contract} from 'ethers'
import {getLighterConfig, LighterConfig} from '../../config'
import {IERC20Metadata, IFactory} from '../../typechain-types'
import * as Factory from '@elliottech/lighter-v2-core/artifacts/contracts/Factory.sol/Factory.json'

export async function getAAVEPoolAt(address: string): Promise<IPool> {
  const [signer] = await ethers.getSigners()
  return new Contract(address, AAVEPoolV3.abi, signer) as IPool
}

export async function getFactoryAt(address: string): Promise<IFactory> {
  const [signer] = await ethers.getSigners()
  return new Contract(address, Factory.abi, signer) as IFactory
}

export async function getTokenAt(address: string): Promise<IERC20Metadata> {
  const [signer] = await ethers.getSigners()
  return (await ethers.getContractAt('IERC20Metadata', address, signer)) as IERC20Metadata
}

export async function getATokenAt(address: string) {
  const [signer] = await ethers.getSigners()
  return new Contract(address, IATokenABI.abi, signer) as IAToken
}

export async function deployTokens(config?: LighterConfig) {
  if (config == null) {
    config = await getLighterConfig()
  }

  return {
    weth: await getTokenAt(config.Tokens['WETH']!),
    aweth: await getATokenAt(config.Tokens['aArbWETH']!),
    vweth: await getTokenAt(config.Tokens['vArbWETH']!),

    usdc: await getTokenAt(config.Tokens['USDC']!),
    ausdc: await getATokenAt(config.Tokens['aArbUSDC']!),
    vusdc: await getTokenAt(config.Tokens['vArbUSDC']!),
  }
}
