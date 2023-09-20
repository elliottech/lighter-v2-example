import {BigNumber, BigNumberish, utils} from 'ethers'

export const parseAmount = (amount: BigNumber, tokenPrecision: number): BigNumber => {
  return ParseTokenAmount(amount, tokenPrecision)
}

export const parseBaseAmount = (amount: BigNumber, tokenPrecision: number, sizeTick: BigNumber): BigNumber => {
  return ParseTokenAmount(amount, tokenPrecision).div(sizeTick)
}

export const parseBasePrice = (price: BigNumber, tokenPrecision: number, priceTick: BigNumber): BigNumber => {
  return ParseTokenAmount(price, tokenPrecision).div(priceTick)
}

export const ParseTokenAmount = (value: BigNumberish, precision: number): BigNumber => {
  if (typeof value == 'string') {
    return utils.parseUnits(value, precision)
  }
  if (typeof value == 'number') {
    return BigNumber.from(value * 10 ** 6).mul(BigNumber.from(10).pow(precision - 6))
  }
  return BigNumber.from(value).mul(BigNumber.from(10).pow(precision))
}
