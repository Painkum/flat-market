import type { Address } from "viem";

function optionalAddress(value?: string): Address | undefined {
  if (!value) return undefined;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as Address;
}

export const collectionAddress = optionalAddress(
  process.env.NEXT_PUBLIC_COLLECTION_ADDRESS
);
export const marketplaceAddress = optionalAddress(
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
);
export const redemptionAddress = optionalAddress(
  process.env.NEXT_PUBLIC_REDEMPTION_ADDRESS
);

export const contractsConfigured = Boolean(
  collectionAddress && marketplaceAddress && redemptionAddress
);
