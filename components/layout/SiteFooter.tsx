import Link from "next/link";
import { EXPLORER_URL, FAUCET_URL, TARGET_CHAIN } from "@/lib/web3/chain";

const COLUMNS = [
  {
    title: "Market",
    links: [
      { href: "/marketplace", label: "All listings" },
      { href: "/marketplace?utility=ACCESS", label: "Access passes" },
      { href: "/marketplace?utility=REDEEMABLE", label: "Redeemables" },
      { href: "/marketplace?utility=TIME_LIMITED", label: "Time-limited" },
    ],
  },
  {
    title: "You",
    links: [
      { href: "/collection", label: "My collection" },
      { href: "/my-listings", label: "My listings" },
      { href: "/watchlist", label: "Watchlist" },
      { href: "/create", label: "Creator studio" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink bg-paper-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <p className="display text-4xl">FLAT MARKET</p>
          <p className="mt-3 max-w-xs text-sm text-ink-soft">
            Utility collectibles on {TARGET_CHAIN.name}. Ownership, supply, and redemption are enforced on-chain.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-xs tracking-[0.16em] text-ink-soft uppercase">{column.title}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-xs tracking-[0.16em] text-ink-soft uppercase">Network</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="link-underline">
                Block explorer ↗
              </a>
            </li>
            {TARGET_CHAIN.testnet ? (
              <li>
                <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="link-underline">
                  Testnet faucet ↗
                </a>
              </li>
            ) : null}
            <li className="font-mono text-xs text-ink-soft">Chain ID {TARGET_CHAIN.id}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-soft">
          Collectibles are bought for what they unlock. Nothing here is a promise of future value.
        </p>
      </div>
    </footer>
  );
}
