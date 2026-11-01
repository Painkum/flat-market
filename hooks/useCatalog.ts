"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { DEMO_COLLECTIBLES, DEMO_COLLECTIONS } from "@/lib/demo-data";
import { contractsConfigured } from "@/lib/contracts/addresses";
import { loadOnchainCatalog } from "@/lib/web3/load-catalog";
import type { Collectible, CollectionRecord } from "@/lib/types";

export function useCatalog() {
  const client = usePublicClient();

  const query = useQuery({
    queryKey: ["catalog", client?.chain?.id],
    enabled: Boolean(client && contractsConfigured),
    queryFn: async () => {
      if (!client) return { collections: [] as CollectionRecord[], collectibles: [] as Collectible[] };
      return loadOnchainCatalog(client);
    },
    staleTime: 15_000,
  });

  const onchainCollections = query.data?.collections ?? [];
  const onchainCollectibles = query.data?.collectibles ?? [];

  return {
    collections: [...onchainCollections, ...DEMO_COLLECTIONS],
    collectibles: [...onchainCollectibles, ...DEMO_COLLECTIBLES],
    onchainCollections,
    onchainCollectibles,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    contractsConfigured,
  };
}

export function filterCollectibles(
  items: Collectible[],
  opts: {
    q?: string;
    category?: string;
    utility?: string;
    sort?: string;
    min?: string;
    max?: string;
    availability?: string;
  }
) {
  const q = opts.q?.trim().toLowerCase() ?? "";
  let next = items.filter((item) => {
    if (q) {
      const haystack = `${item.name} ${item.collectionName} ${item.utilityDescription}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (opts.category && opts.category !== "all" && item.category !== opts.category) return false;
    if (opts.utility && opts.utility !== "all" && item.utilityType !== opts.utility) return false;
    if (opts.availability === "listed" && item.status !== "listed") return false;
    if (opts.availability === "sold" && item.status !== "sold-out") return false;
    const price = item.priceWei ? Number(item.priceWei) / 1e18 : undefined;
    if (opts.min && (price === undefined || price < Number(opts.min))) return false;
    if (opts.max && (price === undefined || price > Number(opts.max))) return false;
    return true;
  });

  if (opts.sort === "low") {
    next = [...next].sort((a, b) => Number(a.priceWei ?? Infinity) - Number(b.priceWei ?? Infinity));
  } else if (opts.sort === "high") {
    next = [...next].sort((a, b) => Number(b.priceWei ?? 0) - Number(a.priceWei ?? 0));
  } else {
    next = [...next].sort((a, b) => {
      if (a.source !== b.source) return a.source === "onchain" ? -1 : 1;
      return (b.tokenId ?? 0) - (a.tokenId ?? 0);
    });
  }

  return next;
}
