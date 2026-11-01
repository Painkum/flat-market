import { getAddress, type Address } from "viem";
import { createConnector } from "wagmi";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export function injected() {
  return createConnector((config) => {
    let provider: EthereumProvider | undefined;

    return {
      id: "injected",
      name: "Browser wallet",
      type: "injected",
      async getProvider() {
        if (typeof window === "undefined") return undefined;
        const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
        provider = ethereum;
        return ethereum;
      },
      async connect({ chainId } = {}) {
        const nextProvider = await this.getProvider();
        if (!nextProvider) throw new Error("No injected wallet found. Install MetaMask or another EVM wallet.");
        const accounts = (await nextProvider.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (nextProvider.on) {
          nextProvider.on("accountsChanged", this.onAccountsChanged);
          nextProvider.on("chainChanged", this.onChainChanged);
          nextProvider.on("disconnect", this.onDisconnect);
        }
        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain?.({ chainId });
          if (chain) currentChainId = chain.id;
        }
        return {
          accounts: accounts.map((account) => getAddress(account)) as readonly Address[],
          chainId: currentChainId,
        };
      },
      async disconnect() {
        const nextProvider = await this.getProvider();
        nextProvider?.removeListener?.("accountsChanged", this.onAccountsChanged);
        nextProvider?.removeListener?.("chainChanged", this.onChainChanged);
        nextProvider?.removeListener?.("disconnect", this.onDisconnect);
      },
      async getAccounts() {
        const nextProvider = await this.getProvider();
        if (!nextProvider) return [];
        const accounts = (await nextProvider.request({ method: "eth_accounts" })) as string[];
        return accounts.map((account) => getAddress(account)) as readonly Address[];
      },
      async getChainId() {
        const nextProvider = await this.getProvider();
        if (!nextProvider) return config.chains[0].id;
        const hex = (await nextProvider.request({ method: "eth_chainId" })) as string;
        return Number(hex);
      },
      async isAuthorized() {
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      },
      async switchChain({ chainId }) {
        const nextProvider = await this.getProvider();
        const chain = config.chains.find((item) => item.id === chainId);
        if (!nextProvider || !chain) throw new Error("Cannot switch network.");
        const hexChainId = `0x${chainId.toString(16)}`;
        try {
          await nextProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }],
          });
        } catch (error) {
          const code = (error as { code?: number }).code;
          if (code === 4902) {
            await nextProvider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: hexChainId,
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: chain.rpcUrls.default.http,
                  blockExplorerUrls: chain.blockExplorers
                    ? [chain.blockExplorers.default.url]
                    : undefined,
                },
              ],
            });
          } else {
            throw error;
          }
        }
        return chain;
      },
      onAccountsChanged(accounts) {
        if (accounts.length === 0) {
          config.emitter.emit("disconnect");
          return;
        }
        config.emitter.emit("change", {
          accounts: accounts.map((account) => getAddress(account)) as readonly Address[],
        });
      },
      onChainChanged(chain) {
        config.emitter.emit("change", { chainId: Number(chain) });
      },
      onDisconnect() {
        config.emitter.emit("disconnect");
      },
    };
  });
}
