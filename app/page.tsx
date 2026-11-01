"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/demo-data";
import { CATEGORIES } from "@/lib/types";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { filterCollectibles, useCatalog } from "@/hooks/useCatalog";

export default function HomePage() {
  const { collectibles, collections, isLoading } = useCatalog();
  const [q, setQ] = useState("");
  const featured = useMemo(
    () => filterCollectibles(collectibles, { availability: "listed" }).slice(0, 6),
    [collectibles]
  );
  const recent = useMemo(() => collectibles.slice(0, 6), [collectibles]);

  return (
    <div className="flex flex-col gap-14">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Robinhood Chain</p>
          <h1 className="display mt-3 max-w-xl text-5xl leading-[0.95] sm:text-7xl">
            Collectibles with jobs.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Buy what a pass unlocks, not a promise of later price. Ownership, listings, and redemption live on-chain.
          </p>
        </div>
        <form
          className="flex flex-col justify-end gap-3"
          action="/marketplace"
        >
          <label htmlFor="home-search" className="text-xs tracking-[0.2em] text-ink-soft uppercase">
            Search the market
          </label>
          <div className="flex gap-2">
            <input
              id="home-search"
              name="q"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Creator pass, voucher, event…"
              className="h-14 flex-1 border border-ink bg-paper-raised px-4 text-base"
            />
            <button type="submit" className="h-14 bg-accent px-5 font-medium text-paper-raised">
              Search
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="display text-3xl">Utility categories</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/marketplace?category=${category}`}
              className="border border-line px-4 py-5 transition-colors duration-200 hover:border-ink"
            >
              <p className="text-sm text-ink-soft">{collections.filter((item) => item.category === category).length} collections</p>
              <p className="display mt-1 text-2xl">{CATEGORY_LABELS[category]}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="display text-3xl">Featured listings</h2>
          <Link href="/marketplace" className="text-sm underline">
            All listings
          </Link>
        </div>
        <CatalogGrid items={featured} loading={isLoading} empty="No listed collectibles yet." />
      </section>

      <section>
        <h2 className="display text-3xl">Recently added</h2>
        <div className="mt-4">
          <CatalogGrid items={recent} loading={isLoading} empty="Create an edition to populate this list." />
        </div>
      </section>
    </div>
  );
}
