"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { TARGET_CHAIN, TARGET_CHAIN_ID } from "@/lib/web3/chain";
import { shortAddress } from "@/lib/utils/format";

export function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);

  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN_ID;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {wrongNetwork ? (
          <button
            type="button"
            onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
            className="h-11 border border-accent bg-accent px-3 text-sm font-medium text-paper-raised transition-colors duration-200 hover:bg-accent-dark"
          >
            {isSwitching ? "Switching…" : `Switch to ${TARGET_CHAIN.name}`}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => disconnect()}
          className="h-11 border border-line bg-paper-raised px-3 font-mono text-xs text-ink transition-colors duration-200 hover:border-ink"
          aria-label={`Disconnect ${address}`}
        >
          {shortAddress(address)}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="h-11 border border-ink bg-ink px-4 text-sm font-medium text-paper transition-colors duration-200 hover:bg-accent"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-72 border border-line bg-paper-raised p-3">
          <p className="text-xs tracking-wide text-ink-soft uppercase">Connect to {TARGET_CHAIN.name}</p>
          <div className="mt-3 flex flex-col gap-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                type="button"
                onClick={() => connect({ connector, chainId: TARGET_CHAIN_ID })}
                className="h-11 border border-line px-3 text-left text-sm transition-colors duration-200 hover:border-ink"
              >
                {connector.name}
              </button>
            ))}
          </div>
          {error ? <p className="mt-2 text-sm text-accent">{error.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
