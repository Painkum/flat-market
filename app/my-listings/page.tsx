"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { useCatalog } from "@/hooks/useCatalog";
import { PageHeader } from "@/components/ui/PageHeader";
import { WalletGate } from "@/components/wallet/WalletGate";
import Link from "next/link";
import { formatEth } from "@/lib/utils/format";

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
    return (
      <WalletGate
        title="Sell what you hold"
        body="Connect a wallet to see and manage your active listings on the marketplace."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Seller"
        title="My listings"
        aside={
          mine.length > 0 ? (
            <div className="border border-line bg-paper-raised px-4 py-3 text-right">
              <p className="text-xs tracking-[0.14em] text-ink-soft uppercase">Listed value</p>
              <p className="display text-3xl">
                {formatEth(
                  mine.reduce(
                    (sum, item) => sum + BigInt(item.priceWei ?? "0") * BigInt(item.listedAmount ?? 0),
                    BigInt(0)
                  )
                )}
              </p>
            </div>
          ) : null
        }
      >
        Only the current owner can list an edition. Cancel or open a collectible to change the price.
      </PageHeader>
      <CatalogGrid
        items={mine}
        loading={isLoading}
        empty="You have no active listings. Open an owned collectible to list it."
        emptyAction={
          <Link
            href="/collection"
            className="inline-flex h-11 items-center border border-ink px-5 text-sm transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            Go to my collection
          </Link>
        }
      />
    </div>
  );
}
