import { EXPLORER_URL, TARGET_CHAIN } from "@/lib/web3/chain";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>FLAT MARKET — utility collectibles on {TARGET_CHAIN.name}.</p>
        <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
          Block explorer
        </a>
      </div>
    </footer>
  );
}
