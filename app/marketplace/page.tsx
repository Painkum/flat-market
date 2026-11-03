"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import {
  ActiveFilters,
  CategoryPills,
  DEFAULT_FILTERS,
  FilterBar,
  type MarketFilters,
} from "@/components/marketplace/Filters";
import { CollectibleSkeleton } from "@/components/marketplace/CollectibleCard";
import { filterCollectibles, useCatalog } from "@/hooks/useCatalog";
import { cx } from "@/lib/utils/format";

const VIEW_KEY = "flatmarket:view";

function fromParams(params: URLSearchParams): MarketFilters {
  return {
    q: params.get("q") ?? DEFAULT_FILTERS.q,
    category: params.get("category") ?? DEFAULT_FILTERS.category,
    utility: params.get("utility") ?? DEFAULT_FILTERS.utility,
    sort: params.get("sort") ?? DEFAULT_FILTERS.sort,
    min: params.get("min") ?? DEFAULT_FILTERS.min,
    max: params.get("max") ?? DEFAULT_FILTERS.max,
    availability: params.get("availability") ?? DEFAULT_FILTERS.availability,
  };
}

function toQuery(filters: MarketFilters) {
  const params = new URLSearchParams();
  (Object.keys(filters) as (keyof MarketFilters)[]).forEach((key) => {
    const value = filters[key].trim();
    if (value && value !== DEFAULT_FILTERS[key]) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function MarketplaceBody() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { collectibles, isLoading } = useCatalog();
  const [filters, setFilters] = useState<MarketFilters>(() => fromParams(params));
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const deferred = useDeferredValue(filters);

  // Header search / palette links update the URL; pull those into local state.
  const paramString = params.toString();
  const lastWritten = useRef<string | null>(null);
  useEffect(() => {
    // Ignore the URL updates we made ourselves; only react to outside navigation.
    if (lastWritten.current !== null && `?${paramString}` === (lastWritten.current || "?")) return;
    const next = fromParams(new URLSearchParams(paramString));
    setFilters((current) => (toQuery(current) === toQuery(next) ? current : next));
  }, [paramString]);

  // Keep the URL shareable as filters change (debounced so typing stays smooth).
  useEffect(() => {
    const id = window.setTimeout(() => {
      const query = toQuery(filters);
      if (query !== (paramString ? `?${paramString}` : "")) {
        lastWritten.current = query;
        router.replace(`${pathname}${query}`, { scroll: false });
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [filters, pathname, router, paramString]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === "list" || saved === "grid") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function changeView(next: "grid" | "list") {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const items = useMemo(() => filterCollectibles(collectibles, deferred), [collectibles, deferred]);

  // Category counts respect every filter except category itself.
  const counts = useMemo(() => {
    const base = filterCollectibles(collectibles, { ...deferred, category: "all" });
    return base.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [collectibles, deferred]);

  const stale = filters !== deferred;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Browse</p>
          <h1 className="display mt-2 text-6xl leading-none sm:text-7xl">Marketplace</h1>
        </div>
        <p className="text-sm text-ink-soft" aria-live="polite">
          <span className="font-mono text-ink">{isLoading ? "…" : items.length}</span> of {collectibles.length} collectibles
        </p>
      </div>

      <CategoryPills
        value={filters.category}
        counts={counts}
        onChange={(category) => setFilters((current) => ({ ...current, category }))}
      />

      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
          className="inline-flex h-11 flex-1 items-center justify-between border border-line px-4 text-sm"
        >
          Search & filters
          <span aria-hidden="true" className={cx("transition-transform duration-300", showFilters && "rotate-180")}>
            ↓
          </span>
        </button>
      </div>

      <div
        className={cx(
          "grid transition-[grid-template-rows] duration-300 lg:grid-rows-[1fr]",
          showFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden lg:overflow-visible">
          <div className="border border-line bg-paper-raised/60 p-4">
            <FilterBar value={filters} onChange={setFilters} />
          </div>
        </div>
      </div>

      <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
        <ActiveFilters value={filters} onChange={setFilters} />
        <div className="ml-auto flex border border-line" role="group" aria-label="Layout">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              aria-label={`${mode} view`}
              onClick={() => changeView(mode)}
              className={cx(
                "flex h-9 w-10 items-center justify-center transition-colors duration-200",
                view === mode ? "bg-ink text-paper" : "hover:bg-paper-raised"
              )}
            >
              {mode === "grid" ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="4" y="4" width="6.5" height="6.5" />
                  <rect x="13.5" y="4" width="6.5" height="6.5" />
                  <rect x="4" y="13.5" width="6.5" height="6.5" />
                  <rect x="13.5" y="13.5" width="6.5" height="6.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={cx("transition-opacity duration-200", stale && "opacity-60")}>
        <CatalogGrid
          key={`${view}-${toQuery(deferred)}`}
          items={items}
          view={view}
          loading={isLoading}
          empty="No collectibles match those filters. Loosen the price range or clear a filter."
          emptyAction={
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="h-11 border border-ink px-5 text-sm transition-colors duration-200 hover:bg-ink hover:text-paper"
            >
              Reset filters
            </button>
          }
        />
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CollectibleSkeleton key={index} />
          ))}
        </div>
      }
    >
      <MarketplaceBody />
    </Suspense>
  );
}
