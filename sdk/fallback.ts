// This file includes the necessary methods for generating the data field for raw transactions
// when making calls to Lighter V2 using calldata compression.
// By opting for these compression methods over ABI encoding, we cut down the calldata size for transactions,
// leading to a significant drop in gas costs.

import {BigNumber, BigNumberish} from 'ethers'

export const fixedSize = (s: string, len: number) => {
  if (s.length > len) throw new Error(`given size (${s.length}) is too big to fit in ${len}`)
  return s.padStart(len, '0')
}

// addressToCallData returns a hex-encoded address, without the `0x` prefix
function addressToCallData(address: string): string {
  return fixedSize(address.toString().replace('0x', ''), 40)
}

// numberToCallData returns a hex-encoded number, without the `0x` prefix, with desired number of bytes
function numberToCallData(amount: BigNumberish, numBytes: number): string {
  return fixedSize(BigNumber.from(amount).toHexString().replace('0x', ''), numBytes * 2)
}

class SizePaddedNumber {
  value: BigNumber

  constructor(value: BigNumberish) {
    this.value = BigNumber.from(value)
  }

  getHexString(): string {
    if (this.value.eq(0)) {
      return '00'
    }

    let chunks: number[] = []
    let copy = BigNumber.from(this.value)
    while (copy.gte(1 << 5)) {
      chunks.push(copy.mod(256).toNumber())
      copy = copy.div(256)
    }

    if (chunks.length > 7) {
      throw `number too big value=${this.value.toString()} extraBytes=${chunks.length}`
    }

    let final = BigNumber.from(this.value)
    const extraBytes = chunks.length
    const prefixAdded = extraBytes * (1 << 5)

    final = final.add(BigNumber.from(256).pow(extraBytes).mul(prefixAdded))

    return numberToCallData(final, extraBytes + 1)
  }
}

class MantissaFormattedNumber {
  type: number
  exponent: number
  mantissa: BigNumber

  private constructor(exponent: number, mantissa: BigNumber, type: number) {
    this.type = type
    this.exponent = exponent
    this.mantissa = mantissa
  }

  static from(_value: BigNumberish, _type: number): MantissaFormattedNumber {
    const value = BigNumber.from(_value)
    let PRECISION = BigNumber.from('2').pow(8 * (2 * _type + 3))
    let MAX_EXPONENT = 60

    if (value == BigNumber.from(0)) return new MantissaFormattedNumber(0, BigNumber.from(0), 0)

    let exponent = 0
    let mantissa = value

    while (mantissa.gte(PRECISION)) {
      mantissa = mantissa.div(10)
      exponent++
    }

    if (exponent > MAX_EXPONENT) {
      throw 'exponent too big'
    }

    // make the mantissa smaller if the precision is the same
    while (mantissa.mod(10).eq(0) && exponent < MAX_EXPONENT) {
      mantissa = mantissa.div(10)
      exponent++
    }

    // Represent the mantissa with the smallest possible type
    let type = _type
    if (type > 1 && mantissa.lt(BigNumber.from('2').pow(40))) type = 1
    if (type > 0 && mantissa.lt(BigNumber.from('2').pow(24))) type = 0

    return new MantissaFormattedNumber(exponent, mantissa, type)
  }

  getHexString(): string {
    let hexString = numberToCallData(this.type * 64 + this.exponent, 1)
    hexString += numberToCallData(this.mantissa, 2 * this.type + 3)

    return hexString
  }
}

export function getCreateLimitOrderFallbackData(
  orderBookId: BigNumberish,
  orders: {
    amount0Base: BigNumberish
    priceBase: BigNumberish
    isAsk: boolean
    hintId: number
  }[]
) {
  let data = '0x'
  data += numberToCallData(1, 1)
  data += numberToCallData(orderBookId, 1)

  // batch all isAsk bits in one big number
  let isAsk = BigNumber.from(0)
  for (let i = 0; i < orders.length; i += 1) {
    if (orders[i].isAsk) {
      isAsk = isAsk.add(BigNumber.from(2).pow(i))
    }
  }
  data += new SizePaddedNumber(isAsk).getHexString()

  for (const order of orders) {
    data += new SizePaddedNumber(order.amount0Base).getHexString()
    data += new SizePaddedNumber(order.priceBase).getHexString()
    data += new SizePaddedNumber(order.hintId).getHexString()
  }

  return data
}

export function getCreateIOCOrderFallbackData(
  orderBookId: BigNumberish,
  order: {
    amount0Base: BigNumberish
    priceBase: BigNumberish
    isAsk: boolean
  }
) {
  let data = '0x'
  data += numberToCallData(4 + Number(order.isAsk), 1)
  data += numberToCallData(orderBookId, 1)
  data += new SizePaddedNumber(order.amount0Base).getHexString()
  data += new SizePaddedNumber(order.priceBase).getHexString()
  return data
}

export function getCreateFOKOrderFallbackData(
  orderBookId: BigNumberish,
  order: {
    amount0Base: BigNumberish
    priceBase: BigNumberish
    isAsk: boolean
  }
) {
  let data = '0x'
  data += numberToCallData(6 + Number(order.isAsk), 1)
  data += numberToCallData(orderBookId, 1)
  data += new SizePaddedNumber(order.amount0Base).getHexString()
  data += new SizePaddedNumber(order.priceBase).getHexString()
  return data
}

export function getUpdateLimitOrderFallbackData(
  orderBookId: number,
  orders: {
    orderId: number
    newAmount0Base: BigNumberish
    newPriceBase: BigNumberish
    hintId: number
  }[]
) {
  let data = '0x'
  data += numberToCallData(2, 1)
  data += numberToCallData(orderBookId, 1)

  for (const order of orders) {
    data += new SizePaddedNumber(order.orderId).getHexString()
    data += new SizePaddedNumber(order.newAmount0Base).getHexString()
    data += new SizePaddedNumber(order.newPriceBase).getHexString()
    data += new SizePaddedNumber(order.hintId).getHexString()
  }

  return data
}

export function getCancelLimitOrderFallbackData(orderBookId: BigNumberish, orderIDs: [BigNumberish]) {
  let data = '0x'
  data += numberToCallData(3, 1)
  data += numberToCallData(orderBookId, 1)

  for (let orderID of orderIDs) {
    data += new SizePaddedNumber(orderID).getHexString()
  }

  return data
}

export function getSwapExactInputSingleFallbackData(
  orderBookId: BigNumberish,
  isAsk: boolean,
  exactInput: BigNumberish,
  minOutput: BigNumberish,
  recipient: string,
  unwrap: boolean,
  sender: string
) {
  const ExactInputSingleFallbackStart = 8

  let data = '0x'
  const recipientIsMsgSender = recipient == sender
  data += BigNumber.from(ExactInputSingleFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')

  // orderBookId & isAsk
  if (orderBookId > 127) {
    throw `orderBookId too big for compressed form ${orderBookId}`
  }
  const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
  data += numberToCallData(compressed, 1)

  data += MantissaFormattedNumber.from(exactInput, 2).getHexString()
  data += MantissaFormattedNumber.from(minOutput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += addressToCallData(recipient)
  }
  return data
}

export function getSwapExactOutputSingleFallbackData(
  orderBookId: BigNumberish,
  isAsk: boolean,
  exactOutput: BigNumberish,
  maxInput: BigNumberish,
  recipient: string,
  unwrap: boolean,
  sender: string
) {
  const ExactOutputSingleFallbackStart = 12

  let data = '0x'
  const recipientIsMsgSender = recipient == sender
  data += BigNumber.from(ExactOutputSingleFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')

  // orderBookId & isAsk
  if (orderBookId > 127) {
    throw `orderBookId too big for compressed form ${orderBookId}`
  }
  const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
  data += numberToCallData(compressed, 1)

  data += MantissaFormattedNumber.from(exactOutput, 2).getHexString()
  data += MantissaFormattedNumber.from(maxInput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += addressToCallData(recipient)
  }
  return data
}

export async function getSwapExactInputMultiFallbackData(
  swapRequests: {
    isAsk: boolean
    orderBookId: BigNumberish
  }[],
  exactInput: BigNumberish,
  minOutput: BigNumberish,
  recipient: string,
  unwrap: boolean,
  sender: string
): Promise<string> {
  const MultiPathExactInputFallbackStart = 16

  let data = '0x'
  const recipientIsMsgSender = recipient == sender
  data += BigNumber.from(MultiPathExactInputFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')
  data += MantissaFormattedNumber.from(await exactInput, 2).getHexString()
  data += MantissaFormattedNumber.from(await minOutput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += addressToCallData(recipient)
  }
  for (let swap of swapRequests) {
    if (swap.orderBookId > 127) {
      throw `orderBookId too big for compressed form ${swap.orderBookId}`
    }
    const isAsk = swap.isAsk
    const orderBookId = swap.orderBookId
    const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
    data += numberToCallData(compressed, 1)
  }
  return data
}

export async function getSwapExactOutputMultiFallbackData(
  swapRequests: {
    isAsk: boolean
    orderBookId: BigNumberish
  }[],
  exactOutput: BigNumberish,
  maxInput: BigNumberish,
  recipient: string,
  unwrap: boolean,
  sender: string
): Promise<string> {
  const MultiPathExactOutputFallbackStart = 20

  let data = '0x'
  const recipientIsMsgSender = recipient == sender
  data += BigNumber.from(MultiPathExactOutputFallbackStart + Number(unwrap) + 2 * Number(recipientIsMsgSender))
    .toHexString()
    .replace('0x', '')
  data += MantissaFormattedNumber.from(exactOutput, 2).getHexString()
  data += MantissaFormattedNumber.from(maxInput, 2).getHexString()
  if (!recipientIsMsgSender) {
    data += addressToCallData(recipient)
  }
  for (let swap of swapRequests) {
    if (swap.orderBookId > 127) {
      throw `orderBookId too big for compressed form ${swap.orderBookId}`
    }
    const isAsk = await swap.isAsk
    const orderBookId = await swap.orderBookId
    const compressed = BigNumber.from(orderBookId).toNumber() + (isAsk ? 128 : 0)
    data += numberToCallData(compressed, 1)
  }
  return data
}
