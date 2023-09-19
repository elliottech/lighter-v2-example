import {ethers} from 'hardhat'
import {IFactory, SwapWallet} from '../typechain-types'
import {deployTokens, ParseUSDC, reset, getFactoryAt, ParseWETH} from './shared'
import {fundAccount} from './token'
import {getLighterConfig} from '../config'

async function deploySwapWallet(factory: IFactory) {
  const contractFactory = await ethers.getContractFactory('SwapWallet')
  return (await contractFactory.deploy(factory.address)) as SwapWallet
}

describe('Swap wallet', async () => {
  beforeEach(async function () {
    await reset()
  })

  it('it swaps exact input USDC for WETH', async () => {
    const config = await getLighterConfig()
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {usdc} = await deployTokens()
    const amount = ParseUSDC(1000)
    await fundAccount(usdc, wallet.address, amount)

    await wallet.swapExactInput(0, false, amount, ParseWETH(0.25), wallet.address)
  })
  it('it swaps exact input WETH for USDC', async () => {
    const config = await getLighterConfig()
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {weth} = await deployTokens()
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount)

    await wallet.swapExactInput(0, true, amount, ParseUSDC(1000), wallet.address)
  })
  it('it swaps exact output USDC for WETH', async () => {
    const config = await getLighterConfig()
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {usdc} = await deployTokens()
    const amount = ParseUSDC(1000)
    await fundAccount(usdc, wallet.address, amount)

    await wallet.swapExactOutput(0, false, ParseWETH(0.25), amount, wallet.address)
  })
  it('it swaps exact output WETH for USDC', async () => {
    const config = await getLighterConfig()
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {weth} = await deployTokens()
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount)

    await wallet.swapExactOutput(0, true, ParseUSDC(1000), amount, wallet.address)
  })
})
