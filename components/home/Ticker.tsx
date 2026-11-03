import Link from "next/link";
import type { Collectible } from "@/lib/types";
import { UTILITY_LABELS } from "@/lib/demo-data";
import { formatEth } from "@/lib/utils/format";

/** Infinite scrolling strip of current listings. Pauses on hover. */
export function Ticker({ items }: { items: Collectible[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div className="group relative overflow-hidden border-y border-ink bg-ink text-paper">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {loop.map((item, index) => (
          <Link
            key={`${item.id}-${index}`}
            href={`/collectible/${item.id}`}
            tabIndex={index >= items.length ? -1 : 0}
            aria-hidden={index >= items.length}
            className="flex items-center gap-3 px-6 py-3 text-sm whitespace-nowrap transition-colors hover:text-accent"
          >
            <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
            <span className="display text-lg">{item.name}</span>
            <span className="text-paper/60">{UTILITY_LABELS[item.utilityType]}</span>
            <span className="font-mono">{formatEth(item.priceWei)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
