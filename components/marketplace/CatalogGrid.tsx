import type { ReactNode } from "react";
import type { Collectible } from "@/lib/types";
import { CollectibleCard, CollectibleRow, CollectibleSkeleton } from "@/components/marketplace/CollectibleCard";

export function CatalogGrid({
  items,
  loading,
  empty,
  emptyAction,
  view = "grid",
  columns = 3,
}: {
  items: Collectible[];
  loading?: boolean;
  empty: string;
  emptyAction?: ReactNode;
  view?: "grid" | "list";
  columns?: 3 | 4;
}) {
  const gridClass =
    columns === 4
      ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: columns === 4 ? 8 : 6 }).map((_, index) => (
          <CollectibleSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-in border border-dashed border-line px-6 py-16 text-center">
        <p className="display text-3xl">Nothing here yet</p>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">{empty}</p>
        {emptyAction ? <div className="mt-5 flex justify-center">{emptyAction}</div> : null}
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="border-t border-line">
        {items.map((item, index) => (
          <div key={item.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}>
            <CollectibleRow item={item} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <div key={item.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}>
          <CollectibleCard item={item} priority={index < 3} />
        </div>
      ))}
    </div>
  );
}
