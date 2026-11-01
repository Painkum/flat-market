export const UTILITY_TYPES = ["ACCESS", "REDEEMABLE", "TIME_LIMITED", "COLLECTIBLE"] as const;
export type UtilityType = (typeof UTILITY_TYPES)[number];

export const CATEGORIES = [
  "creator-pass",
  "community",
  "event",
  "gaming",
  "digital-art",
  "voucher",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type CollectibleSource = "demo" | "onchain";

export type ListingStatus = "listed" | "unlisted" | "sold-out" | "unavailable";

export type Collectible = {
  id: string;
  source: CollectibleSource;
  tokenId?: number;
  listingId?: number;
  collectionId: string;
  collectionName: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  owner?: string;
  priceWei?: string;
  listedAmount?: number;
  maxSupply: number;
  minted: number;
  utilityType: UtilityType;
  utilityDescription: string;
  transferable: boolean;
  expiry?: number;
  category: Category;
  status: ListingStatus;
  socials?: string;
};

export type CollectionRecord = {
  id: string;
  source: CollectibleSource;
  collectionId?: number;
  name: string;
  description: string;
  cover: string;
  creator: string;
  category: Category;
  itemCount: number;
};

export type AccessResult = {
  eligible: boolean;
  ownsToken: boolean;
  expired: boolean;
  balance: bigint;
  redeemedAmount: bigint;
  unredeemedAmount: bigint;
  utilityType: UtilityType;
  expiry: number;
};
