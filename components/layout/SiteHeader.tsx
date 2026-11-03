"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cx } from "@/lib/utils/format";

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/create", label: "Create" },
  { href: "/collection", label: "My collection" },
  { href: "/my-listings", label: "My listings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useWatchlist();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((value) => !value);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled ? "border-line bg-paper/90 shadow-[0_1px_0_0_var(--line)] backdrop-blur-md" : "border-transparent bg-paper"
        )}
      >
        <div
          className={cx(
            "mx-auto flex max-w-6xl items-center gap-3 px-4 transition-[padding] duration-300",
            scrolled ? "py-2" : "py-4"
          )}
        >
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="FLAT MARKET home">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center bg-ink text-paper transition-transform duration-300 group-hover:-rotate-6"
            >
              <span className="display text-xl leading-none">F</span>
            </span>
            <span className="display hidden text-2xl tracking-tight sm:inline">FLAT MARKET</span>
          </Link>

          <nav className="ml-4 hidden items-center lg:flex" aria-label="Main">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative px-3 py-2 text-sm transition-colors duration-200",
                    active ? "text-ink" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cx(
                      "absolute inset-x-3 -bottom-0.5 h-[2px] origin-left bg-accent transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setPalette(true)}
            className="ml-auto hidden h-11 min-w-0 flex-1 items-center gap-3 border border-line bg-paper-raised px-3 text-left text-sm text-ink-soft transition-colors duration-200 hover:border-ink md:flex lg:max-w-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="flex-1 truncate">Search</span>
            <kbd className="border border-line px-1.5 py-0.5 font-mono text-[10px]">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:ml-0">
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="flex h-11 w-11 items-center justify-center border border-line md:hidden"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            <Link
              href="/watchlist"
              className={cx(
                "relative flex h-11 w-11 items-center justify-center border transition-colors duration-200 hover:border-ink",
                isActive(pathname, "/watchlist") ? "border-ink" : "border-line"
              )}
              aria-label={`Watchlist, ${count} saved`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill={count ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 20.5s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z" />
              </svg>
              {count > 0 ? (
                <span
                  key={count}
                  className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 animate-scale-in items-center justify-center bg-accent px-1 font-mono text-[10px] text-paper-raised"
                >
                  {count}
                </span>
              ) : null}
            </Link>
            <ConnectWallet />
            <button
              type="button"
              className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 border border-line lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span className={cx("h-px w-5 bg-ink transition-transform duration-300", open && "translate-y-[3.5px] rotate-45")} />
              <span className={cx("h-px w-5 bg-ink transition-transform duration-300", open && "-translate-y-[3.5px] -rotate-45")} />
            </button>
          </div>
        </div>

        <div
          className={cx(
            "grid overflow-hidden border-line transition-[grid-template-rows,border-color] duration-300 lg:hidden",
            open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr] border-transparent"
          )}
        >
          <nav className="min-h-0 px-4" aria-label="Mobile">
            {LINKS.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "flex items-center justify-between border-b border-line py-3.5 text-lg last:border-0",
                  isActive(pathname, link.href) ? "text-ink" : "text-ink-soft"
                )}
                style={{ transitionDelay: `${index * 30}ms` }}
              >
                <span className="display text-2xl">{link.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}
