"use client";

import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { FAUCET_URL, TARGET_CHAIN, TARGET_CHAIN_ID } from "@/lib/web3/chain";
import { contractsConfigured } from "@/lib/contracts/addresses";

export function NetworkBanner() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const wrong = isConnected && chainId !== TARGET_CHAIN_ID;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem("flatmarket:banner") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (!wrong && contractsConfigured) return null;
  if (!wrong && dismissed) return null;

  return (
    <div className="animate-fade-in border-b border-line bg-paper-raised">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        {wrong ? (
          <>
            <p>
              Connected to the wrong network. FLAT MARKET uses {TARGET_CHAIN.name} (chain ID {TARGET_CHAIN_ID}).
            </p>
            <button
              type="button"
              onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
              className="h-11 shrink-0 border border-accent px-3 font-medium text-accent transition-colors duration-200 hover:bg-accent hover:text-paper-raised"
            >
              Switch network
            </button>
          </>
        ) : (
          <>
            <p>
              {contractsConfigured
                ? `Live on ${TARGET_CHAIN.name}. Need test ETH?`
                : "Contracts are not deployed yet. Demo collectibles are labeled. Deploy to Robinhood Chain testnet to enable minting, buying, and redemption."}
            </p>
            <div className="flex shrink-0 items-center gap-2">
            {TARGET_CHAIN.testnet ? (
              <a
                href={FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 shrink-0 items-center border border-line px-3 font-medium transition-colors duration-200 hover:border-ink"
              >
                Testnet faucet
              </a>
            ) : null}
            <button
              type="button"
              aria-label="Dismiss notice"
              onClick={() => {
                setDismissed(true);
                try {
                  window.sessionStorage.setItem("flatmarket:banner", "1");
                } catch {
                  /* ignore */
                }
              }}
              className="h-11 w-11 text-lg text-ink-soft hover:text-ink"
            >
              ×
            </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
