import { createConfig, http } from "wagmi";
import { TARGET_CHAIN } from "@/lib/web3/chain";
import { injected } from "@/lib/web3/injected";

const rpcUrl = TARGET_CHAIN.rpcUrls.default.http[0];

export const wagmiConfig = createConfig({
  chains: [TARGET_CHAIN],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [TARGET_CHAIN.id]: http(rpcUrl),
  },
  ssr: true,
});
