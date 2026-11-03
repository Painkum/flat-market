"use client";

import { useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { useCatalog } from "@/hooks/useCatalog";
import { collectionAddress } from "@/lib/contracts/addresses";
import { collectionAbi, redemptionAbi } from "@/lib/contracts/abis";
import { redemptionAddress } from "@/lib/contracts/addresses";
import type { Collectible } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { WalletGate } from "@/components/wallet/WalletGate";
import { cx } from "@/lib/utils/format";

const TABS = ["owned", "listed", "redeemed", "expired", "unlisted"] as const;

export default function MyCollectionPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { collectibles, isLoading } = useCatalog();
  const [tab, setTab] = useState<(typeof TABS)[number]>("owned");

  const ownedQuery = useQuery({
    queryKey: ["owned", address, collectibles.map((item) => item.id).join(",")],
    enabled: Boolean(isConnected && address && publicClient && collectionAddress),
    queryFn: async () => {
      const onchain = collectibles.filter((item) => item.source === "onchain" && item.tokenId);
      const rows = await Promise.all(
        onchain.map(async (item) => {
          const balance = await publicClient!.readContract({
            address: collectionAddress!,
            abi: collectionAbi,
            functionName: "balanceOf",
            args: [address!, BigInt(item.tokenId!)],
          });
          let redeemed = BigInt(0);
          if (redemptionAddress) {
            redeemed = await publicClient!.readContract({
              address: redemptionAddress,
              abi: redemptionAbi,
              functionName: "redeemed",
              args: [address!, BigInt(item.tokenId!)],
            });
          }
          return { item, balance, redeemed };
        })
      );
      return rows.filter((row) => row.balance > BigInt(0) || row.redeemed > BigInt(0));
    },
  });

  const grouped = useMemo(() => {
    const now = Date.now() / 1000;
    const owned = (ownedQuery.data ?? []).map((row) => row.item);
    const listed = owned.filter((item) => item.status === "listed" && item.owner?.toLowerCase() === address?.toLowerCase());
    const unlisted = owned.filter((item) => item.status === "unlisted");
    const expired = owned.filter((item) => item.expiry && item.expiry < now);
    const redeemed = (ownedQuery.data ?? [])
      .filter((row) => row.redeemed > BigInt(0))
      .map((row) => row.item);
    return { owned, listed, unlisted, expired, redeemed } satisfies Record<(typeof TABS)[number], Collectible[]>;
  }, [ownedQuery.data, address]);

  if (!isConnected) {
    return (
      <WalletGate
        title="Your collection lives in your wallet"
        body="Connect a wallet to see the passes, tickets, and vouchers you hold — plus what you have redeemed or listed."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Wallet" title="My collection" />
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={cx(
              "relative flex h-12 shrink-0 items-center gap-2 px-4 capitalize transition-colors duration-200",
              tab === item ? "text-ink" : "text-ink-soft hover:text-ink"
            )}
          >
            {item}
            <span className={cx("font-mono text-[11px]", tab === item ? "text-accent" : "text-ink-soft")}>
              {grouped[item].length}
            </span>
            <span
              aria-hidden="true"
              className={cx(
                "absolute inset-x-0 -bottom-px h-[2px] bg-ink transition-transform duration-300",
                tab === item ? "scale-x-100" : "scale-x-0"
              )}
            />
          </button>
        ))}
      </div>
      <CatalogGrid
        key={tab}
        items={grouped[tab]}
        loading={isLoading || ownedQuery.isLoading}
        empty="No collectibles in this state for the connected wallet."
      />
    </div>
  );
}
