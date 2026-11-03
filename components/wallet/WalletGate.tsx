import Link from "next/link";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

/** Shown in place of wallet-only pages until a wallet is connected. */
export function WalletGate({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative animate-fade-up overflow-hidden border border-ink bg-paper-raised px-6 py-16 text-center sm:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rotate-12 border-[18px] border-line" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-12 h-36 w-36 -rotate-6 bg-accent/10" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-ink text-paper">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="3" y="6" width="18" height="13" />
            <path d="M3 10h18M16 14.5h2" />
          </svg>
        </div>
        <h2 className="display mt-6 text-4xl">{title}</h2>
        <p className="mt-3 text-ink-soft">{body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ConnectWallet />
          <Link href="/marketplace" className="inline-flex h-11 items-center px-4 text-sm underline-offset-4 hover:underline">
            Browse the market instead
          </Link>
        </div>
      </div>
    </div>
  );
}
