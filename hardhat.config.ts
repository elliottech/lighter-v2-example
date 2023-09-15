import * as dotenv from 'dotenv'
import {HardhatUserConfig} from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import './tasks'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    testnet: {
      url: `https://rpc.goerli.arbitrum.gateway.fm/`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: `https://arb1.arbitrum.io/rpc`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
}

export default config
