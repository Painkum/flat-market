"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CollectibleActions } from "@/components/collectibles/CollectibleActions";
import { StatusBadge, UtilityBadge } from "@/components/collectibles/UtilityBadge";
import { useCatalog } from "@/hooks/useCatalog";
import { explorerAddress, NATIVE_SYMBOL } from "@/lib/web3/chain";
import { formatEth, shortAddress, supplyLabel } from "@/lib/utils/format";
import { CATEGORY_LABELS } from "@/lib/demo-data";

export default function CollectiblePage() {
  const params = useParams<{ id: string }>();
  const { collectibles, isLoading, refetch } = useCatalog();
  const item = collectibles.find((entry) => entry.id === params.id);

  if (isLoading && !item) {
    return <div className="h-80 animate-pulse bg-line/50" />;
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

  const local = item.image.startsWith("/");
  const expiry = item.expiry ? new Date(item.expiry * 1000).toLocaleString() : "None";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="relative aspect-square border border-line bg-paper">
          {local ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <UtilityBadge utility={item.utilityType} source={item.source} />
          <StatusBadge status={item.status} />
        </div>
        <div>
          <p className="text-sm text-ink-soft">
            <Link href={`/collection/${item.collectionId}`} className="underline">
              {item.collectionName}
            </Link>
          </p>
          <h1 className="display mt-1 text-5xl">{item.name}</h1>
        </div>
        <p className="text-lg text-ink-soft">{item.description}</p>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ink-soft">Price</dt>
            <dd className="font-medium">{formatEth(item.priceWei)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Supply</dt>
            <dd className="font-mono">{supplyLabel(item.minted, item.maxSupply)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Category</dt>
            <dd>{CATEGORY_LABELS[item.category]}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Transferable</dt>
            <dd>{item.transferable ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Expiry</dt>
            <dd>{expiry}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Payment</dt>
            <dd>{NATIVE_SYMBOL}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Creator</dt>
            <dd>
              <a className="font-mono text-xs underline" href={explorerAddress(item.creator)} target="_blank" rel="noreferrer">
                {shortAddress(item.creator)}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Current owner</dt>
            <dd className="font-mono text-xs">{shortAddress(item.owner)}</dd>
          </div>
        </dl>
        <div className="border border-line p-4">
          <p className="text-xs tracking-[0.16em] text-ink-soft uppercase">Utility</p>
          <p className="mt-2">{item.utilityDescription}</p>
        </div>
        <CollectibleActions item={item} onChanged={() => refetch()} />
      </div>
    </div>
  );
}
