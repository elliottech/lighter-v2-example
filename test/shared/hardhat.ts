import {network} from 'hardhat'
import {HardhatNetworkConfig} from 'hardhat/types'

export async function reset() {
  await network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: (network.config as HardhatNetworkConfig).forking!.url,
          blockNumber: (network.config as HardhatNetworkConfig).forking!.blockNumber,
        },
      },
    ],
  })
}
