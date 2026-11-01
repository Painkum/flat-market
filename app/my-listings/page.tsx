"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { useCatalog } from "@/hooks/useCatalog";

export default function MyListingsPage() {
  const { address, isConnected } = useAccount();
  const { collectibles, isLoading } = useCatalog();

  const mine = useMemo(
    () =>
      collectibles.filter(
        (item) =>
          item.source === "onchain" &&
          item.status === "listed" &&
          item.owner &&
          address &&
          item.owner.toLowerCase() === address.toLowerCase()
      ),
    [collectibles, address]
  );

  if (!isConnected) {
    return <p>Connect a wallet to manage listings.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Seller</p>
        <h1 className="display mt-2 text-5xl">My listings</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Only the current owner can list an edition. Cancel or open a collectible to change the price.
        </p>
      </div>
      <CatalogGrid
        items={mine}
        loading={isLoading}
        empty="You have no active listings. Open an owned collectible to list it."
      />
    </div>
  );
}
