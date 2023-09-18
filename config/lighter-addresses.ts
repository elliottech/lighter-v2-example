import { ChainKey, LighterConfig, OrderBookKey, Token } from "./types";

export const addresses: {
    [ChainKey: string]: LighterConfig;
} = {
    [ChainKey.ARBITRUM_GOERLI]: {
        Router: "",
        OrderBooks: {
            [OrderBookKey.WETH_USDC]: "",
            [OrderBookKey.WBTC_USDC]: "",
        },
        Tokens: {
            [Token.WETH]: "",
            [Token.WBTC]: "",
            [Token.USDC]: ""
        }
    },
    [ChainKey.ARBITRUM]: {
        Router: "",
        OrderBooks: {
            [OrderBookKey.WETH_USDC]: "",
            [OrderBookKey.WBTC_USDC]: "",
        },
        Tokens: {
            [Token.WETH]: "",
            [Token.WBTC]: "",
            [Token.USDC]: ""
        }
    },
};
