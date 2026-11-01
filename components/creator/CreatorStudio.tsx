"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";
import { CATEGORY_INDEX, CATEGORY_LABELS, UTILITY_LABELS } from "@/lib/demo-data";
import { UTILITY_TYPES } from "@/lib/types";
import { collectionAbi, marketplaceAbi } from "@/lib/contracts/abis";
import {
  collectionAddress,
  contractsConfigured,
  marketplaceAddress,
} from "@/lib/contracts/addresses";
import { explorerTx, NATIVE_SYMBOL, TARGET_CHAIN_ID } from "@/lib/web3/chain";
import { describeTxError } from "@/lib/web3/errors";
import { uploadFile, uploadJson } from "@/lib/metadata/storage";
import { useToast } from "@/components/transactions/TxToast";
import { useCatalog } from "@/hooks/useCatalog";

const field = "h-11 w-full border border-line bg-paper-raised px-3 text-sm";
const area = "min-h-28 w-full border border-line bg-paper-raised p-3 text-sm";

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
  const [hash, setHash] = useState<string>();
  const [collectionName, setCollectionName] = useState("");
  const [collectionDesc, setCollectionDesc] = useState("");
  const [category, setCategory] = useState("0");
  const [socials, setSocials] = useState("");
  const [cover, setCover] = useState<File | null>(null);
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
  const [preview, setPreview] = useState<string>();

  async function run(label: string, exec: () => Promise<`0x${string}`>) {
    setBusy(true);
    push({ tone: "info", title: `${label} pending` });
    try {
      const txHash = await exec();
      setHash(txHash);
      if (!publicClient) throw new Error("No RPC client.");
      const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction reverted.");
      push({ tone: "ok", title: `${label} confirmed` });
      refetch();
      return txHash;
    } catch (error) {
      push({ tone: "warn", title: `${label} failed`, body: describeTxError(error) });
      throw error;
    } finally {
      setBusy(false);
    }
  }

  if (!contractsConfigured) {
    return (
      <div className="border border-line p-6">
        <h2 className="display text-3xl">Contracts are not deployed</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Creator studio writes to CollectibleCollection and Marketplace on Robinhood Chain testnet.
          Deploy with Foundry, then set `NEXT_PUBLIC_COLLECTION_ADDRESS` and `NEXT_PUBLIC_MARKETPLACE_ADDRESS`.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return <div className="border border-line p-6">Connect a wallet to create a collection.</div>;
  }

  if (chainId !== TARGET_CHAIN_ID) {
    return <div className="border border-accent p-6">Switch to Robinhood Chain testnet.</div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <form
        className="flex flex-col gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!address || !collectionAddress) return;
          try {
            if (step === "collection") {
              let coverURI = "";
              if (cover) {
                try {
                  const uploaded = await uploadFile(cover);
                  coverURI = uploaded.uri;
                } catch (error) {
                  push({
                    tone: "warn",
                    title: "IPFS is not configured",
                    body: error instanceof Error ? error.message : "Cover was not pinned.",
                  });
                  coverURI = preview || "";
                }
              }
              await run("Create collection", () =>
                writeContractAsync({
                  address: collectionAddress,
                  abi: collectionAbi,
                  functionName: "createCollection",
                  args: [collectionName, collectionDesc, coverURI, Number(category), socials],
                })
              );
              setStep("edition");
              return;
            }

            const selectedId = collectionId || String(mine.at(-1)?.collectionId ?? "");
            if (!selectedId) {
              push({ tone: "warn", title: "Choose a collection first." });
              return;
            }

            let tokenURI = preview || "";
            if (art) {
              try {
                const image = await uploadFile(art);
                const metadata = await uploadJson({
                  name: editionName,
                  description: editionDesc,
                  image: image.uri,
                  attributes: [
                    { trait_type: "utility", value: UTILITY_TYPES[Number(utilityType)] },
                  ],
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
                address: collectionAddress,
                abi: collectionAbi,
                functionName: "createEdition",
                args: [
                  BigInt(selectedId),
                  editionName,
                  tokenURI,
                  BigInt(supply),
                  transferable,
                  Number(utilityType),
                  utilityDesc || editionDesc,
                  BigInt(expiry),
                ],
              })
            );

            const nextTokenId = await publicClient!.readContract({
              address: collectionAddress,
              abi: collectionAbi,
              functionName: "nextTokenId",
            });
            const tokenId = nextTokenId - BigInt(1);

            if (Number(mintAmount) > 0) {
              await run("Mint", () =>
                writeContractAsync({
                  address: collectionAddress,
                  abi: collectionAbi,
                  functionName: "mint",
                  args: [address, tokenId, BigInt(mintAmount)],
                })
              );
            }

            if (price && marketplaceAddress && transferable) {
              const approved = await publicClient!.readContract({
                address: collectionAddress,
                abi: collectionAbi,
                functionName: "isApprovedForAll",
                args: [address, marketplaceAddress],
              });
              if (!approved) {
                await run("Approve marketplace", () =>
                  writeContractAsync({
                    address: collectionAddress,
                    abi: collectionAbi,
                    functionName: "setApprovalForAll",
                    args: [marketplaceAddress, true],
                  })
                );
              }
              await run("List edition", () =>
                writeContractAsync({
                  address: marketplaceAddress,
                  abi: marketplaceAbi,
                  functionName: "list",
                  args: [tokenId, BigInt(mintAmount || "1"), parseEther(price as `${number}`)],
                })
              );
            }
          } catch {
            /* toast already shown */
          }
        }}
      >
        <div className="flex gap-2">
          <button type="button" className={`h-11 px-4 ${step === "collection" ? "bg-ink text-paper" : "border border-line"}`} onClick={() => setStep("collection")}>
            Collection
          </button>
          <button type="button" className={`h-11 px-4 ${step === "edition" ? "bg-ink text-paper" : "border border-line"}`} onClick={() => setStep("edition")}>
            Collectible
          </button>
        </div>

        {step === "collection" ? (
          <>
            <label className="text-sm">
              Collection name
              <input className={`${field} mt-1`} required value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
            </label>
            <label className="text-sm">
              Description
              <textarea className={`${area} mt-1`} required value={collectionDesc} onChange={(e) => setCollectionDesc(e.target.value)} />
            </label>
            <label className="text-sm">
              Category
              <select className={`${field} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_INDEX.map((item, index) => (
                  <option key={item} value={index}>
                    {CATEGORY_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Cover image
              <input
                className="mt-1 block text-sm"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setCover(file);
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            <label className="text-sm">
              Social link
              <input className={`${field} mt-1`} value={socials} onChange={(e) => setSocials(e.target.value)} placeholder="https://" />
            </label>
          </>
        ) : (
          <>
            <label className="text-sm">
              Collection
              <select className={`${field} mt-1`} value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
                <option value="">Latest created</option>
                {mine.map((collection) => (
                  <option key={collection.id} value={collection.collectionId}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Collectible name
              <input className={`${field} mt-1`} required value={editionName} onChange={(e) => setEditionName(e.target.value)} />
            </label>
            <label className="text-sm">
              Description
              <textarea className={`${area} mt-1`} value={editionDesc} onChange={(e) => setEditionDesc(e.target.value)} />
            </label>
            <label className="text-sm">
              Artwork
              <input
                className="mt-1 block text-sm"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setArt(file);
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Max supply
                <input className={`${field} mt-1`} required value={supply} onChange={(e) => setSupply(e.target.value)} />
              </label>
              <label className="text-sm">
                Mint now
                <input className={`${field} mt-1`} value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} />
              </label>
              <label className="text-sm">
                List price ({NATIVE_SYMBOL})
                <input className={`${field} mt-1`} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="optional" />
              </label>
              <label className="text-sm">
                Utility type
                <select className={`${field} mt-1`} value={utilityType} onChange={(e) => setUtilityType(e.target.value)}>
                  {UTILITY_TYPES.map((item, index) => (
                    <option key={item} value={index}>
                      {UTILITY_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-sm">
              Utility description
              <textarea className={`${area} mt-1`} required value={utilityDesc} onChange={(e) => setUtilityDesc(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={transferable} onChange={(e) => setTransferable(e.target.checked)} />
              Transferable
            </label>
            <label className="text-sm">
              Expiry (optional)
              <input className={`${field} mt-1`} type="datetime-local" value={expiryLocal} onChange={(e) => setExpiryLocal(e.target.value)} />
            </label>
            <p className="text-sm text-ink-soft">
              The blockchain can enforce ownership, supply, transfer locks, expiry, and redemption state. It cannot independently verify an off-chain benefit unless you set an authorized redemption operator.
            </p>
          </>
        )}

        <button type="submit" disabled={busy} className="h-12 bg-accent font-medium text-paper-raised disabled:opacity-50">
          {busy ? "Waiting for confirmation…" : step === "collection" ? "Create collection" : "Review and mint"}
        </button>
        {hash ? (
          <a className="text-sm underline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
            Latest transaction
          </a>
        ) : null}
      </form>
      <aside className="border border-line p-4">
        <p className="text-xs tracking-wide text-ink-soft uppercase">Preview</p>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Upload preview" className="mt-3 aspect-square w-full object-cover" />
        ) : (
          <div className="mt-3 aspect-square bg-line/50" />
        )}
        <p className="display mt-4 text-2xl">{editionName || collectionName || "Untitled"}</p>
        <p className="mt-2 text-sm text-ink-soft">{utilityDesc || collectionDesc || "Utility and artwork appear here before you mint."}</p>
      </aside>
    </div>
  );
}
