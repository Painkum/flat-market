"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { FilterBar } from "@/components/marketplace/Filters";
import { filterCollectibles, useCatalog } from "@/hooks/useCatalog";
import { CollectibleSkeleton } from "@/components/marketplace/CollectibleCard";

function MarketplaceBody() {
  const params = useSearchParams();
  const { collectibles, isLoading } = useCatalog();
  const [filters, setFilters] = useState({
    q: params.get("q") ?? "",
    category: params.get("category") ?? "all",
    utility: params.get("utility") ?? "all",
    sort: params.get("sort") ?? "newest",
    min: "",
    max: "",
    availability: "all",
  });

  const items = useMemo(() => filterCollectibles(collectibles, filters), [collectibles, filters]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Browse</p>
        <h1 className="display mt-2 text-5xl">Marketplace</h1>
      </div>
      <FilterBar value={filters} onChange={setFilters} />
      <CatalogGrid items={items} loading={isLoading} empty="No collectibles match those filters." />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
