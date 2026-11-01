import { defineChain } from "viem";

/**
 * Official Robinhood Chain configuration.
 * Source: https://docs.robinhood.com/chain/connecting
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RH_MAINNET_RPC_URL ||
          "https://rpc.mainnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://rpc.testnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

export const TARGET_CHAIN =
  process.env.NEXT_PUBLIC_CHAIN_ID === "4663" ? robinhoodChain : robinhoodTestnet;

export const TARGET_CHAIN_ID = TARGET_CHAIN.id;
export const EXPLORER_URL = TARGET_CHAIN.blockExplorers.default.url;
export const NATIVE_SYMBOL = TARGET_CHAIN.nativeCurrency.symbol;
export const FAUCET_URL = "https://faucet.testnet.chain.robinhood.com";

export function explorerTx(hash: string) {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddress(address: string) {
  return `${EXPLORER_URL}/address/${address}`;
}
