"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_LABELS, UTILITY_LABELS } from "@/lib/demo-data";
import { CATEGORIES, UTILITY_TYPES, type UtilityType } from "@/lib/types";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { CollectibleImage } from "@/components/collectibles/CollectibleImage";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { RotatingWord } from "@/components/home/RotatingWord";
import { Spotlight } from "@/components/home/Spotlight";
import { Ticker } from "@/components/home/Ticker";
import { filterCollectibles, useCatalog } from "@/hooks/useCatalog";
import { TARGET_CHAIN } from "@/lib/web3/chain";
import { cx } from "@/lib/utils/format";

const STEPS = [
  {
    n: "01",
    title: "Issue with a job",
    body: "Creators set what a collectible does — access, a one-time redemption, a timed benefit — plus supply and transfer rules.",
  },
  {
    n: "02",
    title: "Trade at a fixed price",
    body: "Listings settle in ETH on Robinhood Chain. Supply caps and soulbound locks are enforced by the contract, not by us.",
  },
  {
    n: "03",
    title: "Redeem and verify",
    body: "Holders redeem on-chain. Any app can check access with one call, so the benefit follows the token.",
  },
];

export default function HomePage() {
  const { collectibles, collections, isLoading } = useCatalog();
  const [utility, setUtility] = useState<UtilityType | "all">("all");

  const listed = useMemo(() => filterCollectibles(collectibles, { availability: "listed" }), [collectibles]);
  const spotlight = useMemo(() => listed.slice(0, 5), [listed]);
  const featured = useMemo(
    () => filterCollectibles(listed, { utility }).slice(0, 6),
    [listed, utility]
  );
  const recent = useMemo(() => collectibles.slice(0, 4), [collectibles]);

  const stats = useMemo(() => {
    const prices = listed.map((item) => Number(item.priceWei ?? 0) / 1e18).filter((p) => p > 0);
    const creators = new Set(collectibles.map((item) => item.creator.toLowerCase()));
    return {
      collectibles: collectibles.length,
      listed: listed.length,
      collections: collections.length,
      creators: creators.size,
      floor: prices.length ? Math.min(...prices) : 0,
    };
  }, [collectibles, collections, listed]);

  const categoryCards = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const inCategory = collectibles.filter((item) => item.category === category);
        return {
          category,
          count: inCategory.length,
          image: inCategory[0]?.image ?? collections.find((c) => c.category === category)?.cover ?? "",
        };
      }),
    [collectibles, collections]
  );

  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      {/* Hero */}
      <section className="grid items-center gap-12 pt-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 border border-line bg-paper-raised px-3 py-1.5 text-xs tracking-[0.16em] text-ink-soft uppercase">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping bg-ok opacity-60" />
              <span className="relative inline-flex h-2 w-2 bg-ok" />
            </span>
            {TARGET_CHAIN.name}
          </p>
          <h1 className="display mt-6 text-6xl leading-[0.92] sm:text-8xl">
            Collectibles
            <br />
            that <RotatingWord words={["unlock doors.", "get redeemed.", "expire on time.", "grant access.", "do a job."]} />
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            Buy what a pass unlocks, not a promise of later price. Ownership, listings, and redemption live on-chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="group inline-flex h-13 items-center gap-3 bg-ink px-6 font-medium text-paper transition-colors duration-200 hover:bg-accent"
            >
              Explore the market
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/create"
              className="inline-flex h-13 items-center border border-ink px-6 font-medium transition-colors duration-200 hover:bg-ink hover:text-paper"
            >
              Start creating
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-2 border-t border-line sm:grid-cols-4">
            {[
              { label: "Collectibles", value: <CountUp value={stats.collectibles} /> },
              { label: "Listed now", value: <CountUp value={stats.listed} /> },
              { label: "Creators", value: <CountUp value={stats.creators} /> },
              { label: "Floor (ETH)", value: <CountUp value={stats.floor} decimals={3} /> },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={cx("border-line py-4 pr-4", index > 0 && "sm:border-l sm:pl-4", index % 2 === 1 && "border-l pl-4")}
              >
                <dt className="text-xs tracking-[0.14em] text-ink-soft uppercase">{stat.label}</dt>
                <dd className="display mt-1 text-4xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="animate-fade-up [animation-delay:150ms]">
          <Spotlight items={spotlight} />
        </div>
      </section>

      <div className="mx-[calc(50%-50vw)]">
        <Ticker items={listed} />
      </div>

      {/* Categories */}
      <section>
        <Reveal className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Browse by use</p>
            <h2 className="display mt-2 text-4xl sm:text-5xl">Utility categories</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {categoryCards.map(({ category, count, image }, index) => (
            <Reveal key={category} delay={index * 60}>
              <Link
                href={`/marketplace?category=${category}`}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden border border-line bg-paper-raised p-4 transition-colors duration-300 hover:border-ink sm:aspect-[16/10]"
              >
                {image ? (
                  <div className="absolute inset-0 opacity-25 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0">
                    <CollectibleImage src={image} alt="" sizes="(max-width: 768px) 50vw, 33vw" />
                  </div>
                ) : null}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-paper-raised via-paper-raised/60 to-transparent transition-opacity duration-500 group-hover:opacity-80"
                />
                <div className="relative flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-ink-soft">
                      {String(count).padStart(2, "0")} {count === 1 ? "item" : "items"}
                    </p>
                    <p className="display mt-1 text-2xl leading-tight sm:text-3xl">{CATEGORY_LABELS[category]}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 -translate-x-2 items-center justify-center bg-ink text-paper opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section>
        <Reveal className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">On sale</p>
            <h2 className="display mt-2 text-4xl sm:text-5xl">Featured listings</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter by utility">
            {(["all", ...UTILITY_TYPES] as const).map((type) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={utility === type}
                onClick={() => setUtility(type)}
                className={cx(
                  "h-10 shrink-0 border px-4 text-sm transition-colors duration-200",
                  utility === type ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                )}
              >
                {type === "all" ? "All" : UTILITY_LABELS[type]}
              </button>
            ))}
          </div>
        </Reveal>
        <CatalogGrid
          key={utility}
          items={featured}
          loading={isLoading}
          empty="No listings with this utility yet."
        />
        <div className="mt-8 flex justify-center">
          <Link href="/marketplace" className="group inline-flex items-center gap-2 border-b border-ink pb-1 text-sm">
            See all {stats.listed} listings
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border border-ink bg-paper-raised">
        <div className="grid md:grid-cols-[0.8fr_2fr]">
          <Reveal className="border-b border-ink p-6 md:border-r md:border-b-0 sm:p-8">
            <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">How it works</p>
            <h2 className="display mt-2 text-4xl sm:text-5xl">Utility first. Speculation optional.</h2>
          </Reveal>
          <ol className="grid sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal
                as="li"
                key={step.n}
                delay={index * 100}
                className={cx("group p-6 sm:p-8", index > 0 && "border-t border-line sm:border-t-0 sm:border-l")}
              >
                <span className="font-mono text-sm text-accent">{step.n}</span>
                <h3 className="display mt-4 text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm text-ink-soft">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Recent */}
      <section>
        <Reveal className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Fresh</p>
            <h2 className="display mt-2 text-4xl sm:text-5xl">Recently added</h2>
          </div>
        </Reveal>
        <CatalogGrid items={recent} loading={isLoading} columns={4} empty="Create an edition to populate this list." />
      </section>

      {/* Creator CTA */}
      <Reveal>
        <section className="relative overflow-hidden bg-accent px-6 py-14 text-paper-raised sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rotate-12 border-[28px] border-paper-raised/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 -rotate-6 border-[20px] border-paper-raised/10"
          />
          <div className="relative max-w-2xl">
            <p className="text-xs tracking-[0.2em] uppercase opacity-80">For creators</p>
            <h2 className="display mt-3 text-5xl leading-[0.95] sm:text-6xl">Give your community something to hold.</h2>
            <p className="mt-4 max-w-lg opacity-85">
              Passes, tickets, vouchers, and keys — with supply caps, expiry, and redemption that the chain enforces.
            </p>
            <Link
              href="/create"
              className="group mt-8 inline-flex h-13 items-center gap-3 bg-paper-raised px-6 font-medium text-ink transition-colors duration-200 hover:bg-ink hover:text-paper"
            >
              Open creator studio
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
