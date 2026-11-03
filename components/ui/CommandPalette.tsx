"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { filterCollectibles, useCatalog } from "@/hooks/useCatalog";
import { CATEGORY_LABELS, UTILITY_LABELS } from "@/lib/demo-data";
import { CATEGORIES } from "@/lib/types";
import { CollectibleImage } from "@/components/collectibles/CollectibleImage";
import { cx, formatEth } from "@/lib/utils/format";

type Result =
  | { kind: "item"; id: string; label: string; sub: string; href: string; image: string; price: string }
  | { kind: "link"; id: string; label: string; sub: string; href: string };

const PAGES: Result[] = [
  { kind: "link", id: "p-market", label: "Marketplace", sub: "Browse every listing", href: "/marketplace" },
  { kind: "link", id: "p-create", label: "Create", sub: "Issue a utility collectible", href: "/create" },
  { kind: "link", id: "p-watch", label: "Watchlist", sub: "Items you saved", href: "/watchlist" },
  { kind: "link", id: "p-coll", label: "My collection", sub: "What your wallet holds", href: "/collection" },
  { kind: "link", id: "p-list", label: "My listings", sub: "Manage what you sell", href: "/my-listings" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { collectibles } = useCatalog();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const items: Result[] = filterCollectibles(collectibles, { q: term })
      .slice(0, term ? 7 : 4)
      .map((item) => ({
        kind: "item",
        id: item.id,
        label: item.name,
        sub: `${item.collectionName} · ${UTILITY_LABELS[item.utilityType]}`,
        href: `/collectible/${item.id}`,
        image: item.image,
        price: formatEth(item.priceWei),
      }));
    const cats: Result[] = CATEGORIES.filter((c) => !term || CATEGORY_LABELS[c].toLowerCase().includes(term)).map(
      (c) => ({
        kind: "link",
        id: `c-${c}`,
        label: CATEGORY_LABELS[c],
        sub: "Category",
        href: `/marketplace?category=${c}`,
      })
    );
    const pages = PAGES.filter((p) => !term || p.label.toLowerCase().includes(term));
    const extra: Result[] = term
      ? [
          {
            kind: "link",
            id: "search-all",
            label: `Search marketplace for “${q.trim()}”`,
            sub: "See every match with filters",
            href: `/marketplace?q=${encodeURIComponent(q.trim())}`,
          },
        ]
      : [];
    return [...items, ...extra, ...cats.slice(0, term ? 6 : 3), ...pages];
  }, [collectibles, q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  function go(result: Result | undefined) {
    if (!result) return;
    router.push(result.href);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-[2px] animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="w-full max-w-xl border border-ink bg-paper-raised shadow-[10px_10px_0_0_var(--ink)] animate-scale-in">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => Math.min(results.length - 1, value + 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(0, value - 1));
              } else if (event.key === "Enter") {
                event.preventDefault();
                go(results[active]);
              } else if (event.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Search collectibles, categories, pages…"
            className="h-14 flex-1 bg-transparent text-base outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          />
          <kbd className="hidden border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-soft sm:block">ESC</kbd>
        </div>
        <ul ref={listRef} id="palette-results" role="listbox" className="no-scrollbar max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-ink-soft">No matches. Try a creator, utility, or category.</li>
          ) : null}
          {results.map((result, index) => (
            <li
              key={result.id}
              id={`palette-${result.id}`}
              data-index={index}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(result)}
              className={cx(
                "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-100",
                index === active ? "bg-ink text-paper" : "text-ink"
              )}
            >
              {result.kind === "item" ? (
                <span className="relative h-10 w-10 shrink-0 overflow-hidden border border-line">
                  <CollectibleImage src={result.image} alt="" sizes="40px" />
                </span>
              ) : (
                <span
                  className={cx(
                    "flex h-10 w-10 shrink-0 items-center justify-center border text-sm",
                    index === active ? "border-paper/30" : "border-line"
                  )}
                  aria-hidden="true"
                >
                  →
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{result.label}</span>
                <span className={cx("block truncate text-xs", index === active ? "text-paper/70" : "text-ink-soft")}>
                  {result.sub}
                </span>
              </span>
              {result.kind === "item" ? <span className="shrink-0 font-mono text-xs">{result.price}</span> : null}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-ink-soft">
          <span>
            <kbd className="font-mono">↑↓</kbd> move
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> open
          </span>
          <span className="ml-auto">{collectibles.length} collectibles indexed</span>
        </div>
      </div>
    </div>
  );
}
