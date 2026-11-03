import { createConfig, http } from "wagmi";
import { robinhoodChain, robinhoodTestnet, TARGET_CHAIN } from "@/lib/web3/chain";
import { injected } from "@/lib/web3/injected";


export const wagmiConfig = createConfig({
  chains: [TARGET_CHAIN],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(robinhoodChain.rpcUrls.default.http[0]),
    [robinhoodTestnet.id]: http(robinhoodTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
});
