"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { explorerAddress, NATIVE_SYMBOL, TARGET_CHAIN, TARGET_CHAIN_ID } from "@/lib/web3/chain";
import { cx, shortAddress } from "@/lib/utils/format";

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/** Deterministic two-tone avatar from an address. */
function Identicon({ address }: { address: string }) {
  const hue = parseInt(address.slice(2, 8), 16) % 360;
  const hue2 = (hue + 60) % 360;
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 60% 50%) 0 50%, hsl(${hue2} 55% 45%) 50% 100%)` }}
    />
  );
}

export function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const balance = useBalance({ address, chainId: TARGET_CHAIN_ID, query: { enabled: Boolean(address) } });
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);

  // Wallet state only exists in the browser; render a stable placeholder on the server.
  if (!mounted) {
    return <span className="inline-block h-11 w-20 border border-line sm:w-[8.5rem]" aria-hidden="true" />;
  }

  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN_ID;

  if (isConnected && address) {
    return (
      <div ref={ref} className="relative flex items-center gap-2">
        {wrongNetwork ? (
          <button
            type="button"
            onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
            className="hidden h-11 border border-accent bg-accent px-3 text-sm font-medium text-paper-raised transition-colors duration-200 hover:bg-accent-dark sm:block"
          >
            {isSwitching ? "Switching…" : "Switch network"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex h-11 items-center gap-2 border border-line bg-paper-raised px-3 font-mono text-xs text-ink transition-colors duration-200 hover:border-ink"
        >
          <Identicon address={address} />
          <span className="hidden sm:inline">{shortAddress(address)}</span>
          {wrongNetwork ? <span className="h-2 w-2 bg-accent sm:hidden" aria-label="Wrong network" /> : null}
        </button>
        {open ? (
          <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-72 animate-scale-in border border-ink bg-paper-raised shadow-[6px_6px_0_0_var(--ink)]">
            <div className="border-b border-line p-4">
              <p className="text-xs tracking-[0.14em] text-ink-soft uppercase">{TARGET_CHAIN.name}</p>
              <p className="display mt-1 text-3xl">
                {balance.data
                  ? `${Number(balance.data.formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${NATIVE_SYMBOL}`
                  : "—"}
              </p>
              <p className="mt-1 font-mono text-[11px] break-all text-ink-soft">{address}</p>
            </div>
            <div className="flex flex-col p-1">
              {wrongNetwork ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
                  className="h-10 px-3 text-left text-sm text-accent hover:bg-paper"
                >
                  Switch to {TARGET_CHAIN.name}
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(address);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1400);
                  } catch {
                    /* clipboard blocked */
                  }
                }}
                className="h-10 px-3 text-left text-sm hover:bg-paper"
              >
                {copied ? "Copied ✓" : "Copy address"}
              </button>
              <a
                role="menuitem"
                href={explorerAddress(address)}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center px-3 text-sm hover:bg-paper"
              >
                View on explorer ↗
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
                className="h-10 border-t border-line px-3 text-left text-sm text-ink-soft hover:bg-paper hover:text-ink"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cx(
          "h-11 border border-ink bg-ink px-4 text-sm font-medium whitespace-nowrap text-paper transition-colors duration-200 hover:border-accent hover:bg-accent",
          isPending && "animate-pulse"
        )}
      >
        {isPending ? (
          "Connecting…"
        ) : (
          <>
            Connect<span className="hidden sm:inline"> wallet</span>
          </>
        )}
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-72 animate-scale-in border border-ink bg-paper-raised p-3 text-left shadow-[6px_6px_0_0_var(--ink)]">
          <p className="text-xs tracking-wide text-ink-soft uppercase">Connect to {TARGET_CHAIN.name}</p>
          <div className="mt-3 flex flex-col gap-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                type="button"
                onClick={() => connect({ connector, chainId: TARGET_CHAIN_ID })}
                className="group flex h-11 items-center justify-between border border-line px-3 text-left text-sm transition-colors duration-200 hover:border-ink"
              >
                {connector.name}
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            ))}
          </div>
          {error ? <p className="mt-2 text-sm text-accent">{error.message.split("\n")[0]}</p> : null}
          <p className="mt-3 text-xs text-ink-soft">Works with MetaMask, Rabby, and other browser wallets.</p>
        </div>
      ) : null}
    </div>
  );
}
