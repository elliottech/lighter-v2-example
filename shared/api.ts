import {BigNumber} from 'ethers'
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
    case OrderType.PerformaceLimitOrder:
      functionSelector = 1

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

  data += new SizePaddedNumber(isAsk ? BigNumber.from(1) : BigNumber.from(0)).getHexString()
  data += new SizePaddedNumber(amount0Base).getHexString()
  data += new SizePaddedNumber(priceBase).getHexString()
  data += new SizePaddedNumber(0).getHexString()

  return data
}
