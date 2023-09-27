import * as dotenv from 'dotenv'
import {ethers} from 'ethers'
import {HardhatUserConfig} from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import './tasks'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    hardhat: {
      forking: {
        url: process.env.ARBITRUM_MAINNET_URL ? process.env.ARBITRUM_MAINNET_URL : `https://arb1.arbitrum.io/rpc`,
        blockNumber: 132173014,
      },
    },
    arbgoerli: {
      url: process.env.ARBITRUM_GOERLI_URL
        ? process.env.ARBITRUM_GOERLI_URL
        : `https://rpc.goerli.arbitrum.gateway.fm/`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    arb: {
      url: process.env.ARBITRUM_MAINNET_URL ? process.env.ARBITRUM_MAINNET_URL : `https://arb1.arbitrum.io/rpc`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    optgoerli: {
      url: process.env.OPTIMISM_GOERLI_URL ? process.env.OPTIMISM_GOERLI_URL : `https://optimism-goerli.publicnode.com`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    bsctestnet: {
      url: process.env.BSC_TESTNET_URL ? process.env.BSC_TESTNET_URL : `https://bsc-testnet.publicnode.com`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.POLYGON_MUMBAI_URL ? process.env.POLYGON_MUMBAI_URL : `https://rpc.ankr.com/polygon_mumbai`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
}

export default config
