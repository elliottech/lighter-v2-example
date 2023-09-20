import {ethers, network} from 'hardhat'
import {IFactory, SwapWallet} from '../typechain-types'
import {deployTokens, ParseUSDC, getFactoryAt, ParseWETH, resetTestnet} from './shared'
import {fundAccount} from './token'
import {getLighterConfig} from '../config'
import {expect} from 'chai'

async function deploySwapWallet(factory: IFactory) {
  const contractFactory = await ethers.getContractFactory('SwapWallet')
  return (await contractFactory.deploy(factory.address)) as SwapWallet
}

describe('Swap wallet', async () => {
  beforeEach(async function () {
    // TODO: Use mainnet fork when contracts are deployed
    await resetTestnet()
  })

  it('it swaps exact input USDC for WETH', async () => {
    const config = await getLighterConfig(true)
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)
    const {usdc} = await deployTokens(config)
    const amount = ParseUSDC(1000)
    await fundAccount(usdc, wallet.address, amount, config)

    await wallet.swapExactInput(0, false, amount, ParseWETH(0.25), wallet.address)
  })
  it('it swaps exact input WETH for USDC', async () => {
    const config = await getLighterConfig(true)
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {weth} = await deployTokens(config)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)

    await wallet.swapExactInput(0, true, amount, ParseUSDC(1000), wallet.address)
  })
  it('it swaps exact output USDC for WETH', async () => {
    const config = await getLighterConfig(true)
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {usdc} = await deployTokens(config)
    const amount = ParseUSDC(1000)
    await fundAccount(usdc, wallet.address, amount, config)

    await wallet.swapExactOutput(0, false, ParseWETH(0.25), amount, wallet.address)
  })
  it('it swaps exact output WETH for USDC', async () => {
    const config = await getLighterConfig(true)
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {weth} = await deployTokens(config)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)

    await wallet.swapExactOutput(0, true, ParseUSDC(1000), amount, wallet.address)
  })

  it('can withdraw tokens', async () => {
    const config = await getLighterConfig(true)
    const factory = await getFactoryAt(config.Factory)
    const wallet = await deploySwapWallet(factory)

    const {weth} = await deployTokens(config)
    const amount = ParseWETH(1)
    await fundAccount(weth, wallet.address, amount, config)

    await wallet.withdraw(weth.address, amount)

    const [signer] = await ethers.getSigners()
    expect(await weth.balanceOf(signer.address)).to.equal(amount)
  })
})
