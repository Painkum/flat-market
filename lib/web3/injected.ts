import { getAddress, type Address } from "viem";
import { createConnector } from "wagmi";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: never[]) => void) => void;
  removeListener?: (event: string, listener: (...args: never[]) => void) => void;
};

function readProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

function toAddresses(accounts: string[]) {
  return accounts.map((account) => getAddress(account)) as readonly Address[];
}

/** Minimal EIP-1193 connector for browser wallets (MetaMask, Rabby, Coinbase extension, …). */
export function injected() {
  return createConnector<EthereumProvider | undefined>((config) => {
    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        config.emitter.emit("disconnect");
        return;
      }
      config.emitter.emit("change", { accounts: toAddresses(accounts) });
    };
    const onChainChanged = (chain: string | number) => {
      config.emitter.emit("change", { chainId: Number(chain) });
    };
    const onDisconnect = () => {
      config.emitter.emit("disconnect");
    };

    async function getChainId() {
      const provider = readProvider();
      if (!provider) return config.chains[0].id;
      const hex = (await provider.request({ method: "eth_chainId" })) as string;
      return Number(hex);
    }

    async function getAccounts() {
      const provider = readProvider();
      if (!provider) return [] as readonly Address[];
      const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
      return toAddresses(accounts);
    }

    async function switchChain({ chainId }: { chainId: number }) {
      const provider = readProvider();
      const chain = config.chains.find((item) => item.id === chainId);
      if (!provider || !chain) throw new Error("Cannot switch network.");
      const hexChainId = `0x${chainId.toString(16)}`;
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hexChainId }],
        });
      } catch (error) {
        const code = (error as { code?: number }).code;
        if (code !== 4902) throw error;
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexChainId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
            },
          ],
        });
      }
      return chain;
    }

    return {
      id: "injected",
      name: "Browser wallet",
      type: "injected",
      async getProvider() {
        return readProvider();
      },
      async connect({ chainId } = {}) {
        const provider = readProvider();
        if (!provider) throw new Error("No browser wallet found. Install MetaMask or another EVM wallet.");
        const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
        provider.on?.("accountsChanged", onAccountsChanged);
        provider.on?.("chainChanged", onChainChanged);
        provider.on?.("disconnect", onDisconnect);
        let currentChainId = await getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await switchChain({ chainId });
          currentChainId = chain.id;
        }
        // wagmi's connect return type is generic over `withCapabilities`; plain accounts are what we support.
        return { accounts: toAddresses(accounts), chainId: currentChainId } as never;
      },
      async disconnect() {
        const provider = readProvider();
        provider?.removeListener?.("accountsChanged", onAccountsChanged);
        provider?.removeListener?.("chainChanged", onChainChanged);
        provider?.removeListener?.("disconnect", onDisconnect);
      },
      getAccounts,
      getChainId,
      async isAuthorized() {
        try {
          return (await getAccounts()).length > 0;
        } catch {
          return false;
        }
      },
      switchChain,
      onAccountsChanged(accounts) {
        onAccountsChanged(accounts);
      },
      onChainChanged(chain) {
        onChainChanged(chain);
      },
      onDisconnect() {
        onDisconnect();
      },
    };
  });
}
