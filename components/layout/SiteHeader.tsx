"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { cx } from "@/lib/utils/format";

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/create", label: "Create" },
  { href: "/collection", label: "My collection" },
  { href: "/my-listings", label: "My listings" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/marketplace?q=${encodeURIComponent(next)}` : "/marketplace");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="display shrink-0 text-2xl tracking-tight">
          FLAT MARKET
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                "px-3 py-2 text-sm transition-colors duration-200",
                pathname === link.href ? "text-ink" : "text-ink-soft hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form onSubmit={onSearch} className="ml-auto hidden min-w-0 flex-1 md:block lg:max-w-sm">
          <label className="sr-only" htmlFor="header-search">
            Search collectibles
          </label>
          <input
            id="header-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search collectibles"
            className="h-11 w-full border border-line bg-paper-raised px-3 text-sm outline-none transition-colors duration-200 focus:border-ink"
          />
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ConnectWallet />
          <button
            type="button"
            className="h-11 border border-line px-3 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-line px-4 py-3 lg:hidden">
          <form onSubmit={onSearch} className="mb-3 md:hidden">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search collectibles"
              className="h-11 w-full border border-line bg-paper-raised px-3 text-sm"
            />
          </form>
          <nav className="flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
