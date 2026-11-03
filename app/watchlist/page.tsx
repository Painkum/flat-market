"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCatalog } from "@/hooks/useCatalog";
import { useWatchlist } from "@/hooks/useWatchlist";
import { formatEth } from "@/lib/utils/format";

export default function WatchlistPage() {
  const { collectibles, isLoading } = useCatalog();
  const { ids } = useWatchlist();

  const items = useMemo(() => {
    const byId = new Map(collectibles.map((item) => [item.id, item]));
    return ids.map((id) => byId.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [collectibles, ids]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.priceWei ? BigInt(item.priceWei) : BigInt(0)), BigInt(0)),
    [items]
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Saved"
        title="Watchlist"
        aside={
          items.length > 0 ? (
            <div className="border border-line bg-paper-raised px-4 py-3 text-right">
              <p className="text-xs tracking-[0.14em] text-ink-soft uppercase">One of each</p>
              <p className="display text-3xl">{formatEth(total)}</p>
            </div>
          ) : null
        }
      >
        Collectibles you saved on this device. Tap the heart on any card to add or remove it.
      </PageHeader>
      <CatalogGrid
        items={items}
        loading={isLoading && ids.length > 0 && items.length === 0}
        empty="Nothing saved yet. Hit the heart on a collectible to keep an eye on it."
        emptyAction={
          <Link
            href="/marketplace"
            className="inline-flex h-11 items-center border border-ink px-5 text-sm transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            Browse the marketplace
          </Link>
        }
      />
    </div>
  );
}
