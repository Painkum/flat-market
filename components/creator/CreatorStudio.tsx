"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { parseEther } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";
import { CATEGORY_INDEX, CATEGORY_LABELS, UTILITY_LABELS } from "@/lib/demo-data";
import { UTILITY_TYPES, type UtilityType } from "@/lib/types";
import { collectionAbi, marketplaceAbi } from "@/lib/contracts/abis";
import { collectionAddress, contractsConfigured, marketplaceAddress } from "@/lib/contracts/addresses";
import { explorerTx, NATIVE_SYMBOL, TARGET_CHAIN, TARGET_CHAIN_ID } from "@/lib/web3/chain";
import { describeTxError } from "@/lib/web3/errors";
import { uploadFile, uploadJson } from "@/lib/metadata/storage";
import { useToast } from "@/components/transactions/TxToast";
import { useCatalog } from "@/hooks/useCatalog";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { UtilityBadge } from "@/components/collectibles/UtilityBadge";
import { SupplyBar } from "@/components/ui/SupplyBar";
import { cx } from "@/lib/utils/format";

const field =
  "h-11 w-full border border-line bg-paper-raised px-3 text-sm outline-none transition-colors duration-200 focus:border-ink";
const area =
  "min-h-28 w-full border border-line bg-paper-raised p-3 text-sm outline-none transition-colors duration-200 focus:border-ink";
const label = "flex flex-col gap-1.5 text-sm";

const UTILITY_HINTS: Record<UtilityType, string> = {
  ACCESS: "Unlocks something while held",
  REDEEMABLE: "Can be used once per unit",
  TIME_LIMITED: "Benefit ends at an expiry",
  COLLECTIBLE: "Capped edition, no benefit",
};

function Dropzone({
  file,
  preview,
  onFile,
  label: text,
}: {
  file: File | null;
  preview?: string;
  onFile: (file: File | null) => void;
  label: string;
}) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) onFile(dropped);
  }

  return (
    <div className={label}>
      {text}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cx(
          "group relative flex min-h-36 items-center gap-4 border border-dashed p-4 text-left transition-colors duration-200",
          over ? "border-accent bg-accent/5" : "border-ink-soft hover:border-ink"
        )}
      >
        {file && preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-24 w-24 shrink-0 border border-line object-cover" />
        ) : (
          <span className="flex h-24 w-24 shrink-0 items-center justify-center border border-line bg-paper text-2xl text-ink-soft transition-transform duration-300 group-hover:-translate-y-0.5">
            ↑
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-medium">{file ? file.name : "Drop an image or click to choose"}</span>
          <span className="mt-1 block text-xs text-ink-soft">
            {file ? `${(file.size / 1024).toFixed(0)} KB · click to replace` : "PNG, JPG, GIF or WebP. Square works best."}
          </span>
        </span>
      </button>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept="image/*"
        tabIndex={-1}
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function CreatorStudio() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { push } = useToast();
  const { onchainCollections, refetch } = useCatalog();
  const mine = onchainCollections.filter(
    (collection) => address && collection.creator.toLowerCase() === address.toLowerCase()
  );

  const [step, setStep] = useState<"collection" | "edition">("collection");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>();
  const [hash, setHash] = useState<string>();
  const [collectionName, setCollectionName] = useState("");
  const [collectionDesc, setCollectionDesc] = useState("");
  const [category, setCategory] = useState("0");
  const [socials, setSocials] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>();
  const [collectionId, setCollectionId] = useState("");
  const [editionName, setEditionName] = useState("");
  const [editionDesc, setEditionDesc] = useState("");
  const [utilityType, setUtilityType] = useState("0");
  const [utilityDesc, setUtilityDesc] = useState("");
  const [supply, setSupply] = useState("10");
  const [mintAmount, setMintAmount] = useState("1");
  const [price, setPrice] = useState("");
  const [transferable, setTransferable] = useState(true);
  const [expiryLocal, setExpiryLocal] = useState("");
  const [art, setArt] = useState<File | null>(null);
  const [artPreview, setArtPreview] = useState<string>();

  // Revoke blob URLs when replaced or unmounted.
  useEffect(() => () => void (coverPreview && URL.revokeObjectURL(coverPreview)), [coverPreview]);
  useEffect(() => () => void (artPreview && URL.revokeObjectURL(artPreview)), [artPreview]);

  const blocker = !contractsConfigured
    ? "Contracts are not deployed yet — you can fill this in to preview, but nothing will be sent."
    : !isConnected
      ? "Connect a wallet to create on-chain."
      : chainId !== TARGET_CHAIN_ID
        ? `Switch your wallet to ${TARGET_CHAIN.name}.`
        : null;

  const utility = UTILITY_TYPES[Number(utilityType)];
  const supplyNum = Math.max(0, Number(supply) || 0);
  const mintNum = Math.min(supplyNum, Math.max(0, Number(mintAmount) || 0));
  const preview = step === "edition" ? artPreview ?? coverPreview : coverPreview;

  async function run(text: string, exec: () => Promise<`0x${string}`>) {
    setBusy(true);
    setProgress(text);
    push({ tone: "info", title: `${text} pending`, body: "Confirm in your wallet." });
    try {
      const txHash = await exec();
      setHash(txHash);
      if (!publicClient) throw new Error("No RPC client.");
      const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction reverted.");
      push({ tone: "ok", title: `${text} confirmed` });
      refetch();
      return txHash;
    } catch (error) {
      push({ tone: "warn", title: `${text} failed`, body: describeTxError(error) });
      throw error;
    } finally {
      setBusy(false);
      setProgress(undefined);
    }
  }

  async function submitCollection(collection: `0x${string}`) {
    let coverURI = "";
    if (cover) {
      try {
        coverURI = (await uploadFile(cover)).uri;
      } catch (error) {
        push({
          tone: "warn",
          title: "IPFS is not configured",
          body: error instanceof Error ? error.message : "Cover was not pinned.",
        });
      }
    }
    await run("Create collection", () =>
      writeContractAsync({
        address: collection,
        abi: collectionAbi,
        functionName: "createCollection",
        args: [collectionName, collectionDesc, coverURI, Number(category), socials],
      })
    );
    setStep("edition");
  }

  async function submitEdition(owner: `0x${string}`, collection: `0x${string}`) {
    const client = publicClient;
    if (!client) throw new Error("No RPC client.");
    const selectedId = collectionId || String(mine.at(-1)?.collectionId ?? "");
    if (!selectedId) {
      push({ tone: "warn", title: "Choose a collection first." });
      return;
    }

    let tokenURI = "";
    if (art) {
      try {
        const image = await uploadFile(art);
        const metadata = await uploadJson({
          name: editionName,
          description: editionDesc,
          image: image.uri,
          attributes: [{ trait_type: "utility", value: utility }],
        });
        tokenURI = metadata.uri;
      } catch (error) {
        push({
          tone: "warn",
          title: "Metadata stayed local",
          body: error instanceof Error ? error.message : "Pinata JWT missing.",
        });
      }
    }

    const expiry = expiryLocal ? Math.floor(new Date(expiryLocal).getTime() / 1000) : 0;
    await run("Create edition", () =>
      writeContractAsync({
        address: collection,
        abi: collectionAbi,
        functionName: "createEdition",
        args: [
          BigInt(selectedId),
          editionName,
          tokenURI,
          BigInt(supplyNum),
          transferable,
          Number(utilityType),
          utilityDesc || editionDesc,
          BigInt(expiry),
        ],
      })
    );

    const nextTokenId = await client.readContract({
      address: collection,
      abi: collectionAbi,
      functionName: "nextTokenId",
    });
    const tokenId = nextTokenId - BigInt(1);

    if (mintNum > 0) {
      await run("Mint", () =>
        writeContractAsync({
          address: collection,
          abi: collectionAbi,
          functionName: "mint",
          args: [owner, tokenId, BigInt(mintNum)],
        })
      );
    }

    const market = marketplaceAddress;
    if (price && market && transferable && mintNum > 0) {
      const approved = await client.readContract({
        address: collection,
        abi: collectionAbi,
        functionName: "isApprovedForAll",
        args: [owner, market],
      });
      if (!approved) {
        await run("Approve marketplace", () =>
          writeContractAsync({
            address: collection,
            abi: collectionAbi,
            functionName: "setApprovalForAll",
            args: [market, true],
          })
        );
      }
      await run("List edition", () =>
        writeContractAsync({
          address: market,
          abi: marketplaceAbi,
          functionName: "list",
          args: [tokenId, BigInt(mintNum), parseEther(price as `${number}`)],
        })
      );
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <form
        className="flex flex-col gap-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const collection = collectionAddress;
          if (blocker || !address || !collection) return;
          try {
            if (step === "collection") await submitCollection(collection);
            else await submitEdition(address, collection);
          } catch {
            /* toast already shown */
          }
        }}
      >
        {blocker ? (
          <div className="flex flex-col gap-3 border border-accent bg-accent/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>{blocker}</p>
            {contractsConfigured && !isConnected ? <ConnectWallet /> : null}
          </div>
        ) : null}

        <ol className="grid grid-cols-2 border border-line" aria-label="Steps">
          {(
            [
              ["collection", "01", "Collection", "Who it's from"],
              ["edition", "02", "Collectible", "What it does"],
            ] as const
          ).map(([key, n, title, sub]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setStep(key)}
                aria-current={step === key ? "step" : undefined}
                className={cx(
                  "relative flex w-full items-center gap-3 p-4 text-left transition-colors duration-200",
                  key === "edition" && "border-l border-line",
                  step === key ? "bg-ink text-paper" : "hover:bg-paper-raised"
                )}
              >
                <span className={cx("font-mono text-sm", step === key ? "text-accent" : "text-ink-soft")}>{n}</span>
                <span>
                  <span className="display block text-2xl leading-none">{title}</span>
                  <span className={cx("mt-1 block text-xs", step === key ? "text-paper/70" : "text-ink-soft")}>{sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div key={step} className="flex animate-fade-up flex-col gap-5">
          {step === "collection" ? (
            <>
              <label className={label}>
                Collection name
                <input className={field} required value={collectionName} onChange={(e) => setCollectionName(e.target.value)} placeholder="Studio North" />
              </label>
              <label className={label}>
                Description
                <textarea className={area} required value={collectionDesc} onChange={(e) => setCollectionDesc(e.target.value)} placeholder="What holders get from this collection." />
              </label>
              <div className={label}>
                Category
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CATEGORY_INDEX.map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={category === String(index)}
                      onClick={() => setCategory(String(index))}
                      className={cx(
                        "h-11 border px-3 text-left text-sm transition-colors duration-200",
                        category === String(index) ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                      )}
                    >
                      {CATEGORY_LABELS[item]}
                    </button>
                  ))}
                </div>
              </div>
              <Dropzone
                label="Cover image"
                file={cover}
                preview={coverPreview}
                onFile={(file) => {
                  setCover(file);
                  setCoverPreview(file ? URL.createObjectURL(file) : undefined);
                }}
              />
              <label className={label}>
                Social link
                <input className={field} value={socials} onChange={(e) => setSocials(e.target.value)} placeholder="https://" type="url" />
              </label>
            </>
          ) : (
            <>
              <label className={label}>
                Collection
                <select className={field} value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
                  <option value="">{mine.length ? "Latest created" : "Create a collection first"}</option>
                  {mine.map((collection) => (
                    <option key={collection.id} value={collection.collectionId}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Collectible name
                <input className={field} required value={editionName} onChange={(e) => setEditionName(e.target.value)} placeholder="Atelier Pass" />
              </label>
              <label className={label}>
                Description
                <textarea className={area} value={editionDesc} onChange={(e) => setEditionDesc(e.target.value)} />
              </label>
              <Dropzone
                label="Artwork"
                file={art}
                preview={artPreview}
                onFile={(file) => {
                  setArt(file);
                  setArtPreview(file ? URL.createObjectURL(file) : undefined);
                }}
              />

              <div className={label}>
                Utility type
                <div className="grid gap-2 sm:grid-cols-2">
                  {UTILITY_TYPES.map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={utilityType === String(index)}
                      onClick={() => setUtilityType(String(index))}
                      className={cx(
                        "flex flex-col items-start border p-3 text-left transition-colors duration-200",
                        utilityType === String(index) ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                      )}
                    >
                      <span className="font-medium">{UTILITY_LABELS[item]}</span>
                      <span className={cx("text-xs", utilityType === String(index) ? "text-paper/70" : "text-ink-soft")}>
                        {UTILITY_HINTS[item]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <label className={label}>
                Utility description
                <textarea className={area} required value={utilityDesc} onChange={(e) => setUtilityDesc(e.target.value)} placeholder="Exactly what a holder gets, and how." />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className={label}>
                  Max supply
                  <input className={field} required inputMode="numeric" value={supply} onChange={(e) => setSupply(e.target.value.replace(/\D/g, ""))} />
                </label>
                <label className={label}>
                  Mint now
                  <input className={field} inputMode="numeric" value={mintAmount} onChange={(e) => setMintAmount(e.target.value.replace(/\D/g, ""))} />
                </label>
                <label className={label}>
                  List price ({NATIVE_SYMBOL})
                  <input className={field} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="optional" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={transferable}
                  onClick={() => setTransferable((value) => !value)}
                  className="flex items-center justify-between gap-3 border border-line p-3 text-left text-sm transition-colors hover:border-ink"
                >
                  <span>
                    <span className="block font-medium">{transferable ? "Transferable" : "Soulbound"}</span>
                    <span className="block text-xs text-ink-soft">{transferable ? "Can be sold or sent" : "Stays with the first holder"}</span>
                  </span>
                  <span className={cx("relative h-6 w-11 shrink-0 border transition-colors", transferable ? "border-ink bg-ink" : "border-line bg-paper")}>
                    <span
                      className={cx(
                        "absolute top-0.5 h-4 w-4 transition-all duration-300",
                        transferable ? "left-[22px] bg-paper" : "left-0.5 bg-ink-soft"
                      )}
                    />
                  </span>
                </button>
                <label className={label}>
                  Expiry {utility === "TIME_LIMITED" ? "" : "(optional)"}
                  <input
                    className={field}
                    type="datetime-local"
                    required={utility === "TIME_LIMITED"}
                    value={expiryLocal}
                    onChange={(e) => setExpiryLocal(e.target.value)}
                  />
                </label>
              </div>
              <p className="border-l-2 border-line pl-3 text-sm text-ink-soft">
                The blockchain can enforce ownership, supply, transfer locks, expiry, and redemption state. It cannot independently verify an off-chain benefit unless you set an authorized redemption operator.
              </p>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={busy || Boolean(blocker)}
          className="group flex h-13 items-center justify-center gap-3 bg-accent font-medium text-paper-raised transition-colors duration-200 hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin border-2 border-paper-raised border-t-transparent" aria-hidden="true" />
              {progress ?? "Waiting for confirmation"}…
            </>
          ) : (
            <>
              {step === "collection" ? "Create collection" : "Create, mint & list"}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </>
          )}
        </button>
        {hash ? (
          <a className="text-sm underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
            Latest transaction ↗
          </a>
        ) : null}
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 flex items-center gap-2 text-xs tracking-[0.16em] text-ink-soft uppercase">
          <span className="h-1.5 w-1.5 animate-pulse bg-accent" aria-hidden="true" />
          Live preview
        </p>
        <div className="border border-ink bg-paper-raised shadow-[8px_8px_0_0_var(--ink)]">
          <div className="relative aspect-square overflow-hidden bg-paper">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={preview} src={preview} alt="Upload preview" className="h-full w-full animate-fade-in object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(45deg,var(--line)_0_1px,transparent_1px_12px)]">
                <span className="display text-6xl text-ink-soft">{(editionName || collectionName || "?").slice(0, 1)}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 p-4">
            {step === "edition" ? <UtilityBadge utility={utility} /> : (
              <span className="text-[11px] tracking-[0.14em] text-ink-soft uppercase">{CATEGORY_LABELS[CATEGORY_INDEX[Number(category)]]}</span>
            )}
            <div>
              <p className="display text-3xl leading-tight break-words">
                {(step === "edition" ? editionName : collectionName) || "Untitled"}
              </p>
              {step === "edition" ? <p className="text-sm text-ink-soft">{mine.find((c) => String(c.collectionId) === collectionId)?.name ?? collectionName ?? ""}</p> : null}
            </div>
            <p className="text-sm text-ink-soft">
              {(step === "edition" ? utilityDesc || editionDesc : collectionDesc) || "Utility and artwork appear here before you mint."}
            </p>
            {step === "edition" ? (
              <>
                <SupplyBar minted={mintNum} max={supplyNum || 1} />
                <div className="flex items-end justify-between border-t border-line pt-3 text-sm">
                  <div>
                    <p className="text-xs text-ink-soft">Price</p>
                    <p className="font-medium">{price ? `${price} ${NATIVE_SYMBOL}` : "Unlisted"}</p>
                  </div>
                  <p className="text-xs text-ink-soft">{transferable ? "Transferable" : "Soulbound"}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
