import type { Collectible } from "@/lib/types";
import { CollectibleCard, CollectibleSkeleton } from "@/components/marketplace/CollectibleCard";

export function CatalogGrid({
  items,
  loading,
  empty,
}: {
  items: Collectible[];
  loading?: boolean;
  empty: string;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CollectibleSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="display text-3xl">Nothing here yet</p>
        <p className="mt-2 text-ink-soft">{empty}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <CollectibleCard key={item.id} item={item} />
      ))}
    </div>
  );
}
