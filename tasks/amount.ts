import {BigNumber, BigNumberish, utils} from 'ethers'
import {OrderBookConfig} from '../config'

export const parseAmount = (amount: BigNumberish, tokenPrecision: number): BigNumber => {
  return parseBigNumberish(amount, tokenPrecision)
}

export const parseToAmountBase = (amount: BigNumberish, ob: OrderBookConfig): BigNumber => {
  const parsed = parseBigNumberish(amount, ob.token0Precision)

  if (!parsed.mod(ob.sizeTick).eq(0)) {
    throw `failed to parse amount ${amount.toString()}. would result in loss of precision`
  }
  return parsed.div(ob.sizeTick)
}

export const parseToPriceBase = (price: BigNumberish, ob: OrderBookConfig): BigNumber => {
  const parsed = parseBigNumberish(price, ob.token1Precision)

  if (!parsed.mod(ob.priceTick).eq(0)) {
    throw `failed to parse price ${price.toString()}. would result in loss of precision`
  }
  return parsed.div(ob.priceTick)
}

function parseBigNumberish(value: BigNumberish, precision: number): BigNumber {
  if (typeof value == 'string') {
    return utils.parseUnits(value, precision)
  }
  if (typeof value == 'number') {
    return BigNumber.from(value * 10 ** Math.min(9, precision)).mul(
      BigNumber.from(10).pow(precision - Math.min(9, precision))
    )
  }
  return BigNumber.from(value).mul(BigNumber.from(10).pow(precision))
}
