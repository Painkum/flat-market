"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CollectibleActions } from "@/components/collectibles/CollectibleActions";
import { CollectibleImage } from "@/components/collectibles/CollectibleImage";
import { ShareButton } from "@/components/collectibles/ShareButton";
import { StatusBadge, UtilityBadge } from "@/components/collectibles/UtilityBadge";
import { WatchButton } from "@/components/collectibles/WatchButton";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { Countdown } from "@/components/ui/Countdown";
import { Reveal } from "@/components/ui/Reveal";
import { SupplyBar } from "@/components/ui/SupplyBar";
import { useCatalog } from "@/hooks/useCatalog";
import { explorerAddress, NATIVE_SYMBOL } from "@/lib/web3/chain";
import { formatEth, shortAddress } from "@/lib/utils/format";
import { CATEGORY_LABELS, UTILITY_LABELS } from "@/lib/demo-data";
import type { UtilityType } from "@/lib/types";

const UTILITY_EXPLAINER: Record<UtilityType, string> = {
  ACCESS: "Grants access while it sits in your wallet. Sell or transfer it and the access moves with it.",
  REDEEMABLE: "Can be redeemed once per unit. Redemption is recorded on-chain and cannot be repeated.",
  TIME_LIMITED: "Benefit ends at the on-chain expiry, even if you still hold the token.",
  COLLECTIBLE: "A capped edition with no enforced external benefit.",
};

export default function CollectiblePage() {
  const params = useParams<{ id: string }>();
  const { collectibles, isLoading, refetch } = useCatalog();
  const item = collectibles.find((entry) => entry.id === params.id);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const { siblings, similar } = useMemo(() => {
    if (!item) return { siblings: [], similar: [] };
    const siblings = collectibles.filter((entry) => entry.collectionId === item.collectionId && entry.id !== item.id);
    const siblingIds = new Set(siblings.map((entry) => entry.id));
    const similar = collectibles.filter(
      (entry) => entry.utilityType === item.utilityType && entry.id !== item.id && !siblingIds.has(entry.id)
    );
    return { siblings: siblings.slice(0, 3), similar: similar.slice(0, 3) };
  }, [collectibles, item]);

  if (isLoading && !item) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="aspect-square animate-pulse bg-line/50" />
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse bg-line/50" />
          <div className="h-14 w-3/4 animate-pulse bg-line/50" />
          <div className="h-24 animate-pulse bg-line/50" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="display text-3xl">Collectible not found</p>
        <Link href="/marketplace" className="mt-3 inline-block underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Category", value: CATEGORY_LABELS[item.category] },
    { label: "Transferable", value: item.transferable ? "Yes" : "Soulbound" },
    { label: "Listed units", value: item.listedAmount ?? "—" },
    { label: "Payment", value: NATIVE_SYMBOL },
    {
      label: "Creator",
      value: (
        <a className="font-mono text-xs underline-offset-4 hover:underline" href={explorerAddress(item.creator)} target="_blank" rel="noreferrer">
          {shortAddress(item.creator)} ↗
        </a>
      ),
    },
    { label: "Seller", value: <span className="font-mono text-xs">{shortAddress(item.owner)}</span> },
  ];

  return (
    <div className="flex flex-col gap-20">
      <div>
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <Link href="/marketplace" className="link-underline hover:text-ink">
            Marketplace
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/collection/${item.collectionId}`} className="link-underline hover:text-ink">
            {item.collectionName}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{item.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up lg:sticky lg:top-24 lg:self-start">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden border border-ink bg-paper shadow-[10px_10px_0_0_var(--ink)]"
              aria-label={`Enlarge ${item.name}`}
            >
              <CollectibleImage
                src={item.image}
                alt={item.name}
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <span className="absolute right-3 bottom-3 bg-paper-raised px-3 py-1.5 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Click to enlarge
              </span>
            </button>
          </div>

          <div className="flex animate-fade-up flex-col gap-6 [animation-delay:120ms]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <UtilityBadge utility={item.utilityType} source={item.source} />
                <StatusBadge status={item.status} />
              </div>
              <div className="flex gap-2">
                <WatchButton id={item.id} name={item.name} variant="full" />
                <ShareButton title={item.name} />
              </div>
            </div>

            <div>
              <Link href={`/collection/${item.collectionId}`} className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                {item.collectionName}
              </Link>
              <h1 className="display mt-1 text-6xl leading-[0.95]">{item.name}</h1>
            </div>
            <p className="text-lg text-ink-soft">{item.description}</p>

            <div className="border border-ink bg-paper-raised p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.14em] text-ink-soft uppercase">Price per unit</p>
                  <p className="display mt-1 text-5xl">{formatEth(item.priceWei)}</p>
                </div>
                <p className="font-mono text-sm text-ink-soft">
                  {item.minted} / {item.maxSupply} minted
                </p>
              </div>
              <SupplyBar minted={item.minted} max={item.maxSupply} className="mt-5" />
            </div>

            {item.expiry ? (
              <div className="border border-line p-5">
                <p className="mb-3 text-xs tracking-[0.14em] text-ink-soft uppercase">
                  Utility expires · {new Date(item.expiry * 1000).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
                <Countdown to={item.expiry} />
              </div>
            ) : null}

            <CollectibleActions item={item} onChanged={() => refetch()} />

            <div className="border-l-2 border-accent bg-paper-raised p-5">
              <p className="text-xs tracking-[0.14em] text-ink-soft uppercase">What it unlocks · {UTILITY_LABELS[item.utilityType]}</p>
              <p className="mt-2 text-lg">{item.utilityDescription}</p>
              <p className="mt-3 text-sm text-ink-soft">{UTILITY_EXPLAINER[item.utilityType]}</p>
            </div>

            <dl className="grid grid-cols-2 border-t border-line text-sm sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="border-b border-line py-3 pr-3">
                  <dt className="text-xs text-ink-soft">{fact.label}</dt>
                  <dd className="mt-1">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {siblings.length > 0 ? (
        <section>
          <Reveal className="mb-6 flex items-end justify-between gap-4">
            <h2 className="display text-4xl">More from {item.collectionName}</h2>
            <Link href={`/collection/${item.collectionId}`} className="shrink-0 text-sm underline-offset-4 hover:underline">
              View collection →
            </Link>
          </Reveal>
          <CatalogGrid items={siblings} empty="" />
        </section>
      ) : null}

      {similar.length > 0 ? (
        <section>
          <Reveal className="mb-6">
            <h2 className="display text-4xl">Other {UTILITY_LABELS[item.utilityType].toLowerCase()} collectibles</h2>
          </Reveal>
          <CatalogGrid items={similar} empty="" />
        </section>
      ) : null}

      {zoom ? (
        <div
          className="fixed inset-0 z-[70] flex animate-fade-in cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label={item.name}
        >
          <div className="relative aspect-square w-full max-w-[min(90vh,56rem)] animate-scale-in">
            <CollectibleImage src={item.image} alt={item.name} sizes="90vw" />
          </div>
          <button
            type="button"
            className="absolute top-4 right-4 h-11 w-11 bg-paper-raised text-xl"
            aria-label="Close"
            onClick={() => setZoom(false)}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
