import {ParseEventFunctions} from '../shared'
import {
  ChainId,
  LighterConfig,
  LighterContracts,
  LighterEventSignature,
  LighterEventType,
  OrderBookKey,
  OrderType,
  Token,
} from './types'

// Function to get the string representation of an enum value
export const getOrderTypeString = (value: OrderType): string => {
  switch (value) {
    case OrderType.LimitOrder:
      return 'LimitOrder'
    case OrderType.FoKOrder:
      return 'FoKOrder'
    case OrderType.IoCOrder:
      return 'IoCOrder'
    case OrderType.PerformaceLimitOrder:
      return 'PerformaceLimitOrder'
    default:
      throw new Error('Invalid enum value')
  }
}

export const lighterConfigs: {
  [ChainId: string]: LighterConfig
} = {
  [ChainId.ARBITRUM_GOERLI]: {
    Router: '0x69533aA255E728995044baD3F713EA0F3E786c98',
    Factory: '0xF38d66921bD3d26A92886dbB1ee49bE669E3FCfE',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: '0xc5aac3b83228a5c69efb4c60c00a45b576230a50',
      [OrderBookKey.WBTC_USDC]: '0xca31078c52f770ba2ea95bfbe327a25cfc793230',
      [OrderBookKey.USDT_USDC]: '0x697a5879bad95037929951bc719b3cb8f15bc867',
    },
    Tokens: {
      [Token.WETH]: '0x4d541f0b8039643783492f9865c7f7de4f54eb5f',
      [Token.WBTC]: '0xf133eb356537f0b3b4fdfb98233b45ef8138aa56',
      [Token.USDC]: '0xcc4a8fa63ce5c6a7f4a7a3d2ebcb738ddcd31209',
      [Token.USDT]: '0x03fc54FD8572B76b6F4f5177A016Bac11688Fc5F',

      // this are not real AAVE tokens, but they are here so the tests are passing
      // when deploying tokens using testnet forking
      [Token.aArbWETH]: '0x4d541f0b8039643783492f9865c7f7de4f54eb5f',
      [Token.aArbWBTC]: '0xf133eb356537f0b3b4fdfb98233b45ef8138aa56',
      [Token.aArbUSDC]: '0xcc4a8fa63ce5c6a7f4a7a3d2ebcb738ddcd31209',
      [Token.vArbWETH]: '0x4d541f0b8039643783492f9865c7f7de4f54eb5f',
      [Token.vArbWBTC]: '0xf133eb356537f0b3b4fdfb98233b45ef8138aa56',
      [Token.vArbUSDC]: '0xcc4a8fa63ce5c6a7f4a7a3d2ebcb738ddcd31209',
    },
    Vault: {
      [Token.WETH]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.WBTC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.USDC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
    },
    AAVEPool: '',
  },
  [ChainId.ARBITRUM]: {
    Router: '',
    Factory: '',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: '',
      [OrderBookKey.WBTC_USDC]: '',
    },
    Tokens: {
      [Token.WETH]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      [Token.WBTC]: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      [Token.USDC]: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      [Token.aArbWETH]: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
      [Token.aArbWBTC]: '0x078f358208685046a11C85e8ad32895DED33A249',
      [Token.aArbUSDC]: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
      [Token.vArbWETH]: '0x0c84331e39d6658Cd6e6b9ba04736cC4c4734351',
      [Token.vArbWBTC]: '0x92b42c66840C7AD907b4BF74879FF3eF7c529473',
      [Token.vArbUSDC]: '0xFCCf3cAbbe80101232d343252614b6A3eE81C989',
    },
    Vault: {
      [Token.WETH]: '0x940a7ed683a60220de573ab702ec8f789ef0a402',
      [Token.WBTC]: '0x7546966122e636a601a3ea4497d3509f160771d8',
      [Token.USDC]: '0x5bdf85216ec1e38d6458c870992a69e38e03f7ef',
      [Token.aArbWETH]: '0x6286b9f080d27f860f6b4bb0226f8ef06cc9f2fc',
      [Token.aArbWBTC]: '0x91746d6f9df58b9807a5bb0e54e4ea86600c2dba',
      [Token.aArbUSDC]: '0x3155c5a49aa31ee99ea7fbcb1258192652a8001c',
    },
    AAVEPool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  [ChainId.MUMBAI]: {
    Router: '0x17E57274040AD9ba6f99298E65d9183f81d0598C',
    Factory: '0x05A9C205C423C40c4f19e1e4B6Ffa0CA567484b7',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: '0x3F7e9273d4f644d4b67ec316604d330B8FC13d59',
      [OrderBookKey.WBTC_USDC]: '',
      [OrderBookKey.WMATIC_USDC]: '0x3e6b4DbB8C323704a4F27dFfDb5aCBB2F0279447',
    },
    Tokens: {
      [Token.WETH]: '0x813A9650cda5512a4c6791bb98a30716C5F9FB84',
      [Token.WMATIC]: '0x5d9D20BC86bEEC389B79b247096116deE1B439eC',
      [Token.USDC]: '0x814d30D1bEF64BDca1Ca5CD7631D26C0E057A79b',

      // this are not real AAVE tokens, but they are here so the tests are passing
      // when deploying tokens using testnet forking
      [Token.aArbWETH]: '',
      [Token.aArbWBTC]: '',
      [Token.aArbUSDC]: '',
      [Token.vArbWETH]: '',
      [Token.vArbWBTC]: '',
      [Token.vArbUSDC]: '',
    },
    Vault: {
      [Token.WETH]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.WBTC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.USDC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
    },
    AAVEPool: '',
  },
  [ChainId.BSC_TESTNET]: {
    Router: '0xBDeFBfC2134E584EA7d1C8124Ca77157afaae9c6',
    Factory: '0xD35e8251E49e89860bc6af0eAa8B05800a24849e',
    OrderBooks: {
      [OrderBookKey.WBNB_USDT]: '0xbCafAC158e46725d58bb77316e6f15702F28a744',
      [OrderBookKey.WETH_USDT]: '0xfE9969F8836457ea99530e8c21B51111EA518aC0',
      [OrderBookKey.BUSD_USDT]: '0xEe371d031cC2e8444b6657A18D79148536e07033',
      [OrderBookKey.BTCB_USDT]: '0x9F1073841c170cdF62C9508c1E78D1B261EFaAc8',
      [OrderBookKey.USDC_USDT]: '0x65Aa2597bfAe263f10D30c15606EA05f5455D6ad',
    },
    Tokens: {
      [Token.WBNB]: '0xCc2Bf20eC368624F4d3E89d6b2a408d2e930BbD4',
      [Token.BTCB]: '0x00fa0f66ba7e4656a994ed201bf67cbd874b28e9',
      [Token.WETH]: '0xb8C26C9802edA37ebF93A5B0e5269f7b4E69eA21',
      [Token.USDT]: '0xAfEbEb22c0927dF8b2c0ebE1838e35b6f72F3B9c',
      [Token.BUSD]: '0x1866406f26317323714a180F569d42Ab5334b9C1',
      [Token.USDC]: '0x414F826A801f7AC9f39601dfaa9b6F937a23C340',
    },
    Vault: {
      [Token.WETH]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.BTCB]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.USDC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
    },
    AAVEPool: '',
  },
  [ChainId.OPT_GOERLI]: {
    Router: '0xD1282905bE4Cbc10F3FA121F0dD515Ea51Be0026',
    Factory: '0x19aA42D8997ec340b4f8517c5bF471dD55b43A30',
    OrderBooks: {
      [OrderBookKey.WETH_USDC]: '0xc183Cb1c602dF9f1A8812795Ef486f5743eafEf2',
      [OrderBookKey.USDT_USDC]: '0x3A50f1eE5e2b581c69381BdABCD62f84082f72c9',
    },
    Tokens: {
      [Token.WETH]: '0xABB2b8560e38604337B7081B4E59c2547A0d6Cde',
      [Token.USDC]: '0x59dF4762905e62C040C63E53C06107e157A49241',
      [Token.USDT]: '0xE754C9c04d364Ce6A372bF0f209b5Bf0B2c67A5F',
    },
    Vault: {
      [Token.WETH]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.WBTC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
      [Token.USDC]: '0x86A9E67c3aE6B87Cc23652B2d72a21CB80dec146',
    },
    AAVEPool: '',
  },
}

export const lighterEventSignatures: {
  [LighterEventType: string]: LighterEventSignature
} = {
  [LighterEventType.CREATE_ORDER_EVENT]: {
    contractName: LighterContracts.ORDERBOOK,
    eventSignature: 'CreateOrder(address,uint32,uint64,uint64,bool,uint8)',
    eventName: 'CreateOrder',
    parseEventFunction: ParseEventFunctions.parseCreateOrderEventData,
  },
  [LighterEventType.CANCEL_LIMIT_ORDER_EVENT]: {
    contractName: LighterContracts.ORDERBOOK,
    eventSignature: 'CancelLimitOrder(uint32)',
    eventName: 'CancelLimitOrder',
    parseEventFunction: ParseEventFunctions.parseCancelLimitOrderEventData,
  },
  [LighterEventType.SWAP_EVENT]: {
    contractName: LighterContracts.ORDERBOOK,
    eventSignature: 'Swap(uint32,uint32,address,address,uint256,uint256)',
    eventName: 'Swap',
    parseEventFunction: ParseEventFunctions.parseSwapEventData,
  },
  [LighterEventType.SWAP_EXACT_AMOUNT_EVENT]: {
    contractName: LighterContracts.ORDERBOOK,
    eventSignature: 'SwapExactAmount(address,address,bool,bool,uint256,uint256)',
    eventName: 'SwapExactAmount',
    parseEventFunction: ParseEventFunctions.parseSwapExactAmountEventData,
  },
  [LighterEventType.FLASH_LOAN_EVENT]: {
    contractName: LighterContracts.ORDERBOOK,
    eventSignature: 'FlashLoan(address,address,uint256,uint256)',
    eventName: 'FlashLoan',
    parseEventFunction: ParseEventFunctions.parseFlashLoanEventData,
  },
  [LighterEventType.CLAIMABLE_BALANCE_INCREASE_EVENT]: {
    contractName: LighterContracts.ORDERBOOK,
    eventSignature: 'ClaimableBalanceIncrease(address,uint256,bool)',
    eventName: 'ClaimableBalanceIncrease',
    parseEventFunction: ParseEventFunctions.parseClaimableBalanceIncreaseEventData,
  },
  [LighterEventType.CLAIMABLE_BALANCE_DECREASE_EVENT]: {
    contractName: LighterContracts.ORDERBOOK,
    eventSignature: 'ClaimableBalanceDecrease(address,uint256,bool)',
    eventName: 'ClaimableBalanceDecrease',
    parseEventFunction: ParseEventFunctions.parseClaimableBalanceDecreaseEventData,
  },
}

async function getChainId(): Promise<ChainId> {
  let network = require('hardhat').network
  const chainId = await network.provider.request({method: 'eth_chainId'})
  return parseInt(chainId as string)
}

export async function getLighterConfig(forceTestnet?: boolean) {
  if (forceTestnet) {
    return lighterConfigs[ChainId.ARBITRUM_GOERLI]
  }

  const chainId = await getChainId()
  if (!chainId) {
    throw new Error(`ChainId ${chainId} is not supported`)
  }

  // assume mainnet forking is enabled for hardhat network
  if (chainId == ChainId.HARDHAT) {
    return lighterConfigs[ChainId.ARBITRUM]
  }

  if (!ChainId[chainId]) {
    throw new Error(`ChainId ${chainId} is not supported`)
  }
  return lighterConfigs[chainId]
}
