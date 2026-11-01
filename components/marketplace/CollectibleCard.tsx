import Image from "next/image";
import Link from "next/link";
import type { Collectible } from "@/lib/types";
import { formatEth, supplyLabel } from "@/lib/utils/format";
import { StatusBadge, UtilityBadge } from "@/components/collectibles/UtilityBadge";
import { shortAddress } from "@/lib/utils/format";

export function CollectibleCard({ item }: { item: Collectible }) {
  const local = item.image.startsWith("/");

  return (
    <Link
      href={`/collectible/${item.id}`}
      className="group flex flex-col border border-line bg-paper-raised transition-colors duration-200 hover:border-ink"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        {local ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <UtilityBadge utility={item.utilityType} source={item.source} />
          <StatusBadge status={item.status} />
        </div>
        <div>
          <h3 className="display text-2xl leading-tight">{item.name}</h3>
          <p className="mt-1 text-sm text-ink-soft">{item.collectionName}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 text-sm">
          <div>
            <p className="text-ink-soft">Price</p>
            <p className="font-medium">{formatEth(item.priceWei)}</p>
          </div>
          <div className="text-right">
            <p className="text-ink-soft">Supply</p>
            <p className="font-mono text-xs">{supplyLabel(item.minted, item.maxSupply)}</p>
          </div>
        </div>
        <p className="font-mono text-[11px] text-ink-soft">{shortAddress(item.creator)}</p>
      </div>
    </Link>
  );
}

export function CollectibleSkeleton() {
  return (
    <div className="border border-line">
      <div className="aspect-square animate-pulse bg-line/60" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-24 animate-pulse bg-line/60" />
        <div className="h-7 w-40 animate-pulse bg-line/60" />
        <div className="h-4 w-28 animate-pulse bg-line/60" />
      </div>
    </div>
  );
}
