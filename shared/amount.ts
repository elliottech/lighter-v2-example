import {BigNumber, BigNumberish, utils} from 'ethers'
import {OrderBookConfig} from '../config'

export const parseAmount = (amount: BigNumberish, tokenPrecision: number): BigNumber => {
  return parseBigNumberish(amount, tokenPrecision)
}

export const parseToAmountBase = (amount: BigNumberish, ob: OrderBookConfig): BigNumber => {
  return parseBigNumberish(amount, ob.token0Precision).div(ob.sizeTick)
}

export const parseToPriceBase = (price: BigNumberish, ob: OrderBookConfig): BigNumber => {
  return parseBigNumberish(price, ob.token1Precision).div(ob.priceTick)
}

const parseBigNumberish = (value: BigNumberish, precision: number): BigNumber => {
  if (typeof value == 'string') {
    return utils.parseUnits(value, precision)
  }
  if (typeof value == 'number') {
    return BigNumber.from(value * 10 ** 6).mul(BigNumber.from(10).pow(precision - 6))
  }
  return BigNumber.from(value).mul(BigNumber.from(10).pow(precision))
}
