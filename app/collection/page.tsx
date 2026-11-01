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
    return <p>Connect a wallet to see collectibles you own.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Wallet</p>
        <h1 className="display mt-2 text-5xl">My collection</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`h-11 px-4 capitalize ${tab === item ? "bg-ink text-paper" : "border border-line"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <CatalogGrid
        items={grouped[tab]}
        loading={isLoading || ownedQuery.isLoading}
        empty="No collectibles in this state for the connected wallet."
      />
    </div>
  );
}
