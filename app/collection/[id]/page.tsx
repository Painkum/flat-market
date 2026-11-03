"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { CollectibleImage } from "@/components/collectibles/CollectibleImage";
import { CountUp } from "@/components/ui/CountUp";
import { useCatalog } from "@/hooks/useCatalog";
import { CATEGORY_LABELS } from "@/lib/demo-data";
import { explorerAddress } from "@/lib/web3/chain";
import { cx, shortAddress } from "@/lib/utils/format";

export default function CollectionDetailsPage() {
  const params = useParams<{ id: string }>();
  const { collections, collectibles, isLoading } = useCatalog();
  const [tab, setTab] = useState<"all" | "listed">("all");
  const collection = collections.find((item) => item.id === params.id);
  const items = useMemo(() => collectibles.filter((item) => item.collectionId === params.id), [collectibles, params.id]);
  const listed = useMemo(() => items.filter((item) => item.status === "listed"), [items]);

  const stats = useMemo(() => {
    const prices = listed.map((item) => Number(item.priceWei ?? 0) / 1e18).filter((p) => p > 0);
    const minted = items.reduce((sum, item) => sum + item.minted, 0);
    const supply = items.reduce((sum, item) => sum + item.maxSupply, 0);
    return { floor: prices.length ? Math.min(...prices) : 0, minted, supply };
  }, [items, listed]);

  if (!isLoading && !collection) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="display text-3xl">Collection not found</p>
        <Link href="/marketplace" className="mt-3 inline-block underline">
          Marketplace
        </Link>
      </div>
    );
  }

  if (!collection) return <div className="h-72 animate-pulse bg-line/50" />;

  return (
    <div className="flex flex-col gap-10">
      <section className="relative -mt-8 overflow-hidden border-b border-line pt-8 pb-10">
        {collection.cover ? (
          <div aria-hidden="true" className="absolute inset-0 scale-110 opacity-20 blur-2xl">
            <CollectibleImage src={collection.cover} alt="" sizes="100vw" />
          </div>
        ) : null}
        <div className="relative grid animate-fade-up gap-8 md:grid-cols-[15rem_1fr] md:items-end">
          <div className="relative aspect-square border border-ink bg-paper shadow-[8px_8px_0_0_var(--ink)]">
            <CollectibleImage src={collection.cover} alt={collection.name} sizes="240px" priority />
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">
              {collection.source === "demo" ? "Demo collection" : "On-chain collection"} · {CATEGORY_LABELS[collection.category]}
            </p>
            <h1 className="display mt-2 text-6xl leading-none sm:text-7xl">{collection.name}</h1>
            <p className="mt-4 max-w-2xl text-ink-soft">{collection.description}</p>
            <p className="mt-4 text-sm">
              by{" "}
              <a
                href={explorerAddress(collection.creator)}
                className="font-mono text-xs underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {shortAddress(collection.creator)} ↗
              </a>
            </p>
          </div>
        </div>
        <dl className="relative mt-10 grid grid-cols-2 border border-line bg-paper-raised/80 backdrop-blur-sm sm:grid-cols-4">
          {[
            { label: "Editions", value: <CountUp value={items.length} /> },
            { label: "Listed", value: <CountUp value={listed.length} /> },
            { label: "Minted", value: <span><CountUp value={stats.minted} /><span className="text-ink-soft"> / {stats.supply}</span></span> },
            { label: "Floor (ETH)", value: <CountUp value={stats.floor} decimals={3} /> },
          ].map((stat, index) => (
            <div key={stat.label} className={cx("p-4", index > 0 && "border-l border-line", index === 2 && "max-sm:border-l-0 max-sm:border-t", index === 3 && "max-sm:border-t")}>
              <dt className="text-xs tracking-[0.14em] text-ink-soft uppercase">{stat.label}</dt>
              <dd className="display mt-1 text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div className="mb-6 flex gap-1 border-b border-line" role="tablist">
          {(
            [
              ["all", "All items", items.length],
              ["listed", "Listed", listed.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cx(
                "relative flex h-12 items-center gap-2 px-4 transition-colors duration-200",
                tab === key ? "text-ink" : "text-ink-soft hover:text-ink"
              )}
            >
              {label}
              <span className="font-mono text-[11px] text-ink-soft">{count}</span>
              <span
                aria-hidden="true"
                className={cx(
                  "absolute inset-x-0 -bottom-px h-[2px] bg-ink transition-transform duration-300",
                  tab === key ? "scale-x-100" : "scale-x-0"
                )}
              />
            </button>
          ))}
        </div>
        <CatalogGrid
          key={tab}
          items={tab === "all" ? items : listed}
          loading={isLoading}
          empty={tab === "all" ? "This collection has no editions yet." : "No active listings in this collection."}
        />
      </section>
    </div>
  );
}
