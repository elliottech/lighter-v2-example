export enum ChainKey {
  ARBITRUM = "arbitrum",
  ARBITRUM_GOERLI = "arbitrum-goerli",
}

export enum OrderBookKey {
  WETH_USDC = 'WETH-USDC',
  WBTC_USDC = 'WBTC-USDC'
}

export enum Token {
  WETH = 'WETH',
  USDC = 'USDC',
  WBTC = 'WBTC'
}

export enum ChainId {
  ARBITRUM = 42161,
  ARBITRUM_GOERLI = 421613,
}

export interface LighterConfig {
  Router: string;
  OrderBooks: OrderBookConfig;
  Tokens: TokenConfig;
}

export type DeploymentAddresses = {
  [chainKey in ChainKey]?: LighterConfig;
};

export type OrderBookConfig = {
  [orderBookKey in OrderBookKey]?: string;
}

export type TokenConfig = {
  [token in Token]?: string;
}
