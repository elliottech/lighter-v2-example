import {BigNumber, BigNumberish, utils} from 'ethers'

export function ParseWETH(value: BigNumberish): BigNumber {
  if (typeof value == 'string') {
    return utils.parseUnits(value, 18)
  }
  if (typeof value == 'number') {
    return BigNumber.from(value * 100000000).mul(BigNumber.from(10).pow(10))
  }
  return BigNumber.from(value).mul(BigNumber.from(10).pow(18))
}

export function ParseUSDC(value: BigNumberish): BigNumber {
  if (typeof value == 'string') {
    return utils.parseUnits(value, 6)
  }
  if (typeof value == 'number') {
    return BigNumber.from(value * 1000000)
  }
  return BigNumber.from(value).mul(BigNumber.from(10).pow(6))
}
