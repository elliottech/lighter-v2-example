import {BigNumber, BigNumberish} from 'ethers'
import {NumberToCallData} from './calldata'
import {SizePaddedNumber} from './size-padded-number'
import {OrderType} from '../config'

export function getOrderFallbackData(
  orderBookId: BigNumber,
  orderType: OrderType,
  amount0Base: BigNumber,
  priceBase: BigNumber,
  isAsk: boolean
) {
  let data = '0x'

  let functionSelector: number

  switch (orderType) {
    case OrderType.LimitOrder:
    case OrderType.PerformanceLimitOrder:
      functionSelector = 1
      break

    case OrderType.FoKOrder: {
      functionSelector = isAsk ? 5 : 4
      break
    }

    case OrderType.IoCOrder: {
      functionSelector = isAsk ? 7 : 6
      break
    }
  }

  data += NumberToCallData(functionSelector, 1)
  data += NumberToCallData(orderBookId, 1)
  if (orderType == OrderType.LimitOrder) {
    console.log(isAsk)
    data += new SizePaddedNumber(isAsk ? BigNumber.from(1) : BigNumber.from(0)).getHexString()
    data += new SizePaddedNumber(amount0Base).getHexString()
    data += new SizePaddedNumber(priceBase).getHexString()

    // hintID is here, pass instead
    data += new SizePaddedNumber(0).getHexString()
  } else {
    data += new SizePaddedNumber(amount0Base).getHexString()
    data += new SizePaddedNumber(priceBase).getHexString()
  }

  return data
}

export function getCancelLimitOrderFallbackData(orderBookId: BigNumberish, orderIDs: [BigNumberish]) {
  let data = '0x'
  data += NumberToCallData(3, 1)
  data += NumberToCallData(orderBookId, 1)

  for (let orderID of orderIDs) {
    data += new SizePaddedNumber(orderID).getHexString()
  }

  return data
}
