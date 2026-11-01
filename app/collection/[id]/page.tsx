"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CatalogGrid } from "@/components/marketplace/CatalogGrid";
import { useCatalog } from "@/hooks/useCatalog";
import { CATEGORY_LABELS } from "@/lib/demo-data";
import { explorerAddress } from "@/lib/web3/chain";
import { shortAddress } from "@/lib/utils/format";

export default function CollectionDetailsPage() {
  const params = useParams<{ id: string }>();
  const { collections, collectibles, isLoading } = useCatalog();
  const collection = collections.find((item) => item.id === params.id);
  const items = collectibles.filter((item) => item.collectionId === params.id);
  const listed = items.filter((item) => item.status === "listed");

  if (!isLoading && !collection) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="display text-3xl">Collection not found</p>
        <Link href="/marketplace" className="mt-3 inline-block underline">
          Marketplace
        </Link>
      </div>
    );
  }

  if (!collection) return <div className="h-40 animate-pulse bg-line/50" />;

  const local = collection.cover.startsWith("/");

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <div className="relative aspect-square border border-line">
          {local ? (
            <Image src={collection.cover} alt={collection.name} fill className="object-cover" />
          ) : collection.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.cover} alt={collection.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-line/40" />
          )}
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">
            {collection.source === "demo" ? "Demo collection" : "On-chain collection"}
          </p>
          <h1 className="display mt-2 text-5xl">{collection.name}</h1>
          <p className="mt-4 max-w-2xl text-ink-soft">{collection.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-soft">Creator</dt>
              <dd>
                <a href={explorerAddress(collection.creator)} className="font-mono text-xs underline" target="_blank" rel="noreferrer">
                  {shortAddress(collection.creator)}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-ink-soft">Category</dt>
              <dd>{CATEGORY_LABELS[collection.category]}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Items</dt>
              <dd>{items.length}</dd>
            </div>
          </dl>
        </div>
      </section>
      <section>
        <h2 className="display text-3xl">Listed</h2>
        <div className="mt-4">
          <CatalogGrid items={listed} empty="No active listings in this collection." />
        </div>
      </section>
      <section>
        <h2 className="display text-3xl">All items</h2>
        <div className="mt-4">
          <CatalogGrid items={items} loading={isLoading} empty="This collection has no editions yet." />
        </div>
      </section>
    </div>
  );
}
