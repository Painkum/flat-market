import type { PublicClient } from "viem";
import { collectionAbi, marketplaceAbi, redemptionAbi } from "@/lib/contracts/abis";
import {
  collectionAddress,
  marketplaceAddress,
  redemptionAddress,
} from "@/lib/contracts/addresses";
import { CATEGORY_INDEX } from "@/lib/demo-data";
import type { AccessResult, Collectible, CollectionRecord, UtilityType } from "@/lib/types";
import { UTILITY_TYPES } from "@/lib/types";

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";

export function toHttpUrl(uri: string) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `${IPFS_GATEWAY}/${uri.slice(7)}`;
  return uri;
}

async function resolveImage(uri: string): Promise<string> {
  const url = toHttpUrl(uri);
  if (!url) return "";
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(url)) return url;
  try {
    const response = await fetch(url, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as { image?: string };
      return json.image ? toHttpUrl(json.image) : url;
    }
  } catch {
    return url;
  }
  return url;
}

export async function loadOnchainCatalog(client: PublicClient): Promise<{
  collections: CollectionRecord[];
  collectibles: Collectible[];
}> {
  if (!collectionAddress || !marketplaceAddress) {
    return { collections: [], collectibles: [] };
  }
  const collectionContract = collectionAddress;
  const marketplaceContract = marketplaceAddress;

  const [nextCollectionId, nextTokenId, nextListingId] = await Promise.all([
    client.readContract({
      address: collectionContract,
      abi: collectionAbi,
      functionName: "nextCollectionId",
    }),
    client.readContract({
      address: collectionContract,
      abi: collectionAbi,
      functionName: "nextTokenId",
    }),
    client.readContract({
      address: marketplaceContract,
      abi: marketplaceAbi,
      functionName: "nextListingId",
    }),
  ]);

  const collectionIds = Array.from({ length: Number(nextCollectionId) - 1 }, (_, i) => i + 1).slice(0, 100);
  const tokenIds = Array.from({ length: Number(nextTokenId) - 1 }, (_, i) => i + 1).slice(0, 200);
  const listingIds = Array.from({ length: Number(nextListingId) - 1 }, (_, i) => i + 1).slice(0, 200);

  const collectionRows = await Promise.all(
    collectionIds.map(async (id) => {
      const row = await client.readContract({
        address: collectionContract,
        abi: collectionAbi,
        functionName: "getCollection",
        args: [BigInt(id)],
      });
      return { id, row };
    })
  );

  const collections: CollectionRecord[] = await Promise.all(
    collectionRows.map(async ({ id, row }) => ({
      id: `onchain-col-${id}`,
      source: "onchain" as const,
      collectionId: id,
      name: row.name,
      description: row.description,
      cover: await resolveImage(row.coverURI),
      creator: row.creator,
      category: CATEGORY_INDEX[row.category] ?? "digital-art",
      itemCount: 0,
    }))
  );

  const collectionById = new Map(collections.map((item) => [item.collectionId, item]));

  const editions = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const [edition, minted] = await Promise.all([
        client.readContract({
          address: collectionContract,
          abi: collectionAbi,
          functionName: "getEdition",
          args: [BigInt(tokenId)],
        }),
        client.readContract({
          address: collectionContract,
          abi: collectionAbi,
          functionName: "totalSupply",
          args: [BigInt(tokenId)],
        }),
      ]);
      return { tokenId, edition, minted };
    })
  );

  const listings = await Promise.all(
    listingIds.map(async (listingId) => {
      try {
        const listing = await client.readContract({
          address: marketplaceContract,
          abi: marketplaceAbi,
          functionName: "getListing",
          args: [BigInt(listingId)],
        });
        return { listingId, listing };
      } catch {
        return null;
      }
    })
  );

  const activeByToken = new Map<number, { listingId: number; price: bigint; amount: bigint; seller: string }>();
  for (const entry of listings) {
    if (!entry || !entry.listing.active) continue;
    const tokenId = Number(entry.listing.tokenId);
    const current = activeByToken.get(tokenId);
    if (!current) {
      activeByToken.set(tokenId, {
        listingId: entry.listingId,
        price: entry.listing.pricePerUnit,
        amount: entry.listing.amount,
        seller: entry.listing.seller,
      });
    }
  }

  const collectibles: Collectible[] = await Promise.all(
    editions.map(async ({ tokenId, edition, minted }) => {
      const collection = collectionById.get(Number(edition.collectionId));
      if (collection) collection.itemCount += 1;
      const listing = activeByToken.get(tokenId);
      const mintedNumber = Number(minted);
      const max = Number(edition.maxSupply);
      const expired = edition.expiry !== BigInt(0) && Number(edition.expiry) * 1000 < Date.now();
      let status: Collectible["status"] = listing ? "listed" : "unlisted";
      if (mintedNumber >= max && !listing) status = "sold-out";
      if (expired) status = "unavailable";

      return {
        id: `onchain-${tokenId}`,
        source: "onchain" as const,
        tokenId,
        listingId: listing?.listingId,
        collectionId: collection?.id ?? `onchain-col-${edition.collectionId}`,
        collectionName: collection?.name ?? `Collection #${edition.collectionId}`,
        name: edition.name,
        description: edition.utilityDescription,
        image: await resolveImage(edition.tokenURI),
        creator: edition.creator,
        owner: listing?.seller,
        priceWei: listing ? listing.price.toString() : undefined,
        listedAmount: listing ? Number(listing.amount) : undefined,
        maxSupply: max,
        minted: mintedNumber,
        utilityType: (UTILITY_TYPES[edition.utilityType] ?? "COLLECTIBLE") as UtilityType,
        utilityDescription: edition.utilityDescription,
        transferable: edition.transferable,
        expiry: edition.expiry === BigInt(0) ? undefined : Number(edition.expiry),
        category: collection?.category ?? "digital-art",
        status,
        socials: collection ? undefined : undefined,
      };
    })
  );

  return { collections, collectibles };
}

export async function loadAccess(
  client: PublicClient,
  wallet: `0x${string}`,
  tokenId: number
): Promise<AccessResult | null> {
  if (!redemptionAddress) return null;
  const result = await client.readContract({
    address: redemptionAddress,
    abi: redemptionAbi,
    functionName: "verifyCollectibleAccess",
    args: [wallet, BigInt(tokenId)],
  });
  return {
    eligible: result.eligible,
    ownsToken: result.ownsToken,
    expired: result.expired,
    balance: result.balance,
    redeemedAmount: result.redeemedAmount,
    unredeemedAmount: result.unredeemedAmount,
    utilityType: (UTILITY_TYPES[result.utilityType] ?? "COLLECTIBLE") as UtilityType,
    expiry: Number(result.expiry),
  };
}
