"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Collectible } from "@/lib/types";
import { CollectibleImage } from "@/components/collectibles/CollectibleImage";
import { UtilityBadge } from "@/components/collectibles/UtilityBadge";
import { cx, formatEth } from "@/lib/utils/format";

/** Auto-rotating stack of featured collectibles for the hero. */
export function Spotlight({ items }: { items: Collectible[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => setIndex((value) => (value + 1) % count), 4200);
    return () => window.clearInterval(id);
  }, [paused, count]);

  if (count === 0) {
    return <div className="aspect-[4/5] w-full animate-pulse border border-line bg-line/50" />;
  }

  return (
    <div
      className="relative mx-auto w-full max-w-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[4/5]">
        {items.map((item, i) => {
          const offset = (i - index + count) % count;
          const visible = offset < 3;
          return (
            <Link
              key={item.id}
              href={`/collectible/${item.id}`}
              tabIndex={offset === 0 ? 0 : -1}
              aria-hidden={offset !== 0}
              className={cx(
                "absolute inset-0 flex flex-col border border-ink bg-paper-raised transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
                offset === 0 && "shadow-[10px_10px_0_0_var(--ink)]",
                !visible && "pointer-events-none opacity-0"
              )}
              style={{
                zIndex: count - offset,
                transform:
                  offset === 0
                    ? "none"
                    : `translate(${offset * 14}px, ${offset * -14}px) rotate(${offset * 3}deg) scale(${1 - offset * 0.04})`,
                opacity: visible ? 1 - offset * 0.18 : 0,
              }}
            >
              <div className="relative flex-1 overflow-hidden">
                <CollectibleImage src={item.image} alt={item.name} sizes="(max-width: 1024px) 80vw, 380px" priority={i === 0} />
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-ink p-4">
                <div className="min-w-0">
                  <UtilityBadge utility={item.utilityType} />
                  <p className="display mt-2 truncate text-3xl leading-none">{item.name}</p>
                  <p className="mt-1 truncate text-sm text-ink-soft">{item.collectionName}</p>
                </div>
                <p className="shrink-0 font-mono text-sm">{formatEth(item.priceWei)}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Spotlight">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${item.name}`}
            onClick={() => setIndex(i)}
            className="group flex h-6 items-center"
          >
            <span
              className={cx(
                "block h-[3px] transition-all duration-500",
                i === index ? "w-8 bg-accent" : "w-3 bg-line group-hover:bg-ink-soft"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
