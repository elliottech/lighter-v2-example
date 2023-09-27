import {BigNumberish} from 'ethers'
import {NumberToCallData} from './calldata'
import {SizePaddedNumber} from './size-padded-number'
import {OrderType} from '../config'

export function getCreateLimitOrderFallbackData(
  orderBookId: BigNumberish,
  orderType: OrderType,
  amount0Base: BigNumberish,
  priceBase: BigNumberish,
  isAsk: boolean
) {
  let data = '0x'

  let functionSelector: number
  switch (orderType) {
    case OrderType.LimitOrder: {
      functionSelector = 1
      break
    }
    case OrderType.PerformanceLimitOrder: {
      throw 'PerformanceLimitOrder for supported via router'
    }
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
    // fallback method supports batch order insertion due to this reason, all isAsk bits are compressed in a single number,
    // instead of putting them in the function selector, like in the case of FoK or IoC
    data += new SizePaddedNumber(isAsk ? 1 : 0).getHexString()
    data += new SizePaddedNumber(amount0Base).getHexString()
    data += new SizePaddedNumber(priceBase).getHexString()

    // TODO: request hintId & pass it here
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
