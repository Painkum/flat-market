"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import type { Collectible } from "@/lib/types";
import { cx, formatEth, shortAddress } from "@/lib/utils/format";
import { StatusBadge, UtilityBadge } from "@/components/collectibles/UtilityBadge";
import { CollectibleImage } from "@/components/collectibles/CollectibleImage";
import { WatchButton } from "@/components/collectibles/WatchButton";
import { SupplyBar } from "@/components/ui/SupplyBar";
import { Countdown } from "@/components/ui/Countdown";

/** Grid card with a subtle pointer tilt and light glare. */
export function CollectibleCard({ item, priority }: { item: Collectible; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(event: PointerEvent<HTMLAnchorElement>) {
    const node = ref.current;
    if (!node || event.pointerType !== "mouse") return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    node.style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
    node.style.setProperty("--ry", `${(x - 0.5) * 6}deg`);
    node.style.setProperty("--gx", `${x * 100}%`);
    node.style.setProperty("--gy", `${y * 100}%`);
  }

  function onLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--rx", "0deg");
    node.style.setProperty("--ry", "0deg");
  }

  const lowStock = item.status === "listed" && item.listedAmount !== undefined && item.listedAmount <= 5;

  return (
    <Link
      ref={ref}
      href={`/collectible/${item.id}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ transform: "perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
      className="group relative flex h-full flex-col border border-line bg-paper-raised transition-[transform,border-color,box-shadow] duration-300 ease-out will-change-transform hover:border-ink hover:shadow-[6px_6px_0_0_var(--ink)]"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        <CollectibleImage
          src={item.image}
          alt={item.name}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.28), transparent 55%)",
          }}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <WatchButton id={item.id} name={item.name} />
        </div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {item.utilityType === "TIME_LIMITED" && item.expiry ? (
            <span className="bg-ink px-2 py-1 font-mono text-[11px] text-paper">
              <Countdown to={item.expiry} compact />
            </span>
          ) : null}
          {lowStock ? (
            <span className="bg-accent px-2 py-1 text-[11px] font-medium tracking-[0.12em] text-paper-raised uppercase">
              {item.listedAmount} listed
            </span>
          ) : null}
        </div>
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 translate-y-2 bg-paper-raised px-3 py-1.5 text-xs font-medium opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          View →
        </span>
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
        <SupplyBar minted={item.minted} max={item.maxSupply} />
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3 text-sm">
          <div>
            <p className="text-xs text-ink-soft">Price</p>
            <p className={cx("font-medium", !item.priceWei && "text-ink-soft")}>{formatEth(item.priceWei)}</p>
          </div>
          <p className="font-mono text-[11px] text-ink-soft">{shortAddress(item.creator)}</p>
        </div>
      </div>
    </Link>
  );
}

/** Compact horizontal row used by the list view. */
export function CollectibleRow({ item }: { item: Collectible }) {
  return (
    <Link
      href={`/collectible/${item.id}`}
      className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-line py-3 transition-colors duration-200 hover:bg-paper-raised sm:grid-cols-[5rem_1.4fr_1fr_8rem_7rem_9rem]"
    >
      <div className="relative aspect-square overflow-hidden border border-line">
        <CollectibleImage
          src={item.image}
          alt={item.name}
          sizes="80px"
          className="transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="min-w-0">
        <p className="display truncate text-xl leading-tight">{item.name}</p>
        <p className="truncate text-sm text-ink-soft">{item.collectionName}</p>
      </div>
      <div className="hidden sm:block">
        <UtilityBadge utility={item.utilityType} source={item.source} />
      </div>
      <div className="hidden sm:block">
        <SupplyBar minted={item.minted} max={item.maxSupply} showLabel={false} />
        <p className="mt-1 font-mono text-[11px] text-ink-soft">
          {item.minted} / {item.maxSupply}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <StatusBadge status={item.status} />
      </div>
      <div className="flex items-center justify-end gap-3 text-right">
        <p className="text-sm font-medium whitespace-nowrap">{formatEth(item.priceWei)}</p>
        <WatchButton id={item.id} name={item.name} />
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
        <div className="h-1 w-full animate-pulse bg-line/60" />
        <div className="h-4 w-28 animate-pulse bg-line/60" />
      </div>
    </div>
  );
}
