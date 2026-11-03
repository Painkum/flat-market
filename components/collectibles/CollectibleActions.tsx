"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";
import type { Collectible } from "@/lib/types";
import { collectionAbi, marketplaceAbi, redemptionAbi } from "@/lib/contracts/abis";
import {
  collectionAddress,
  contractsConfigured,
  marketplaceAddress,
  redemptionAddress,
} from "@/lib/contracts/addresses";
import { explorerTx, NATIVE_SYMBOL, TARGET_CHAIN_ID } from "@/lib/web3/chain";
import { describeTxError } from "@/lib/web3/errors";
import { formatEth } from "@/lib/utils/format";
import { useToast } from "@/components/transactions/TxToast";
import { loadAccess } from "@/lib/web3/load-catalog";
import { useQuery } from "@tanstack/react-query";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

function Locked({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border border-dashed border-ink-soft p-5">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-sm text-ink-soft">{body}</p>
      {children}
    </div>
  );
}

export function CollectibleActions({
  item,
  onChanged,
}: {
  item: Collectible;
  onChanged?: () => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { push } = useToast();
  const [qty, setQty] = useState(1);
  const [listPrice, setListPrice] = useState("");
  const [listAmount, setListAmount] = useState("1");
  const [transferTo, setTransferTo] = useState("");
  const [confirm, setConfirm] = useState<"buy" | "redeem" | "list" | null>(null);
  const [hash, setHash] = useState<string>();
  const [busy, setBusy] = useState(false);

  const accessQuery = useQuery({
    queryKey: ["access", address, item.tokenId],
    enabled: Boolean(publicClient && address && item.tokenId && redemptionAddress),
    queryFn: () => loadAccess(publicClient!, address!, item.tokenId!),
  });

  const isOwner = useMemo(() => {
    if (!address) return false;
    if (accessQuery.data) return accessQuery.data.ownsToken;
    return item.owner?.toLowerCase() === address.toLowerCase();
  }, [accessQuery.data, address, item.owner]);

  async function send(label: string, exec: () => Promise<`0x${string}`>) {
    setBusy(true);
    push({ tone: "info", title: `${label} submitted`, body: "Confirm in your wallet, then wait for the receipt." });
    try {
      const txHash = await exec();
      setHash(txHash);
      if (!publicClient) throw new Error("No RPC client.");
      const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaction reverted.");
      push({ tone: "ok", title: `${label} confirmed`, body: "The chain is the source of truth. Catalog will refresh." });
      setConfirm(null);
      onChanged?.();
      accessQuery.refetch();
    } catch (error) {
      push({ tone: "warn", title: `${label} failed`, body: describeTxError(error) });
    } finally {
      setBusy(false);
    }
  }

  if (item.source === "demo") {
    return (
      <Locked
        title="Demo listing"
        body="This is labeled demo content, not an on-chain listing. Deploy the contracts and mint a live edition to buy, list, or redeem."
      >
        <button type="button" disabled className="h-12 cursor-not-allowed bg-ink/10 text-sm font-medium text-ink-soft">
          Buy now · {formatEth(item.priceWei)}
        </button>
      </Locked>
    );
  }

  if (!contractsConfigured || !item.tokenId) {
    return (
      <Locked
        title="Contracts not configured"
        body="Contract addresses are missing. Set them in .env.local after deploying to Robinhood Chain testnet."
      />
    );
  }

  if (!isConnected) {
    return (
      <Locked title="Connect to trade" body="Connect a wallet to buy, list, transfer, or redeem.">
        <div>
          <ConnectWallet />
        </div>
      </Locked>
    );
  }

  if (chainId !== TARGET_CHAIN_ID) {
    return <Locked title="Wrong network" body="Switch to Robinhood Chain testnet to continue." />;
  }

  const maxBuy = item.listedAmount ?? 0;
  const canBuy = item.status === "listed" && item.listingId && maxBuy > 0 && !isOwner;
  const canRedeem =
    isOwner &&
    item.utilityType === "REDEEMABLE" &&
    accessQuery.data &&
    accessQuery.data.unredeemedAmount > BigInt(0) &&
    !accessQuery.data.expired;

  return (
    <div className="flex flex-col gap-4 border border-ink p-5">
      {canBuy ? (
        <div>
          <label className="text-xs tracking-wide text-ink-soft uppercase" htmlFor="qty">
            Quantity
          </label>
          <div className="mt-2 flex gap-2">
            <div className="flex h-12 border border-line bg-paper-raised">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                className="w-10 text-lg transition-colors hover:bg-paper disabled:opacity-30"
              >
                −
              </button>
              <input
                id="qty"
                type="number"
                min={1}
                max={maxBuy}
                value={qty}
                onChange={(event) => setQty(Math.min(maxBuy, Math.max(1, Number(event.target.value) || 1)))}
                className="w-12 [appearance:textfield] bg-transparent text-center font-mono [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={qty >= maxBuy}
                onClick={() => setQty((value) => Math.min(maxBuy, value + 1))}
                className="w-10 text-lg transition-colors hover:bg-paper disabled:opacity-30"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={busy || isPending}
              onClick={() => setConfirm("buy")}
              className="h-12 flex-1 bg-accent text-sm font-medium text-paper-raised transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
            >
              Buy now · {formatEth(BigInt(item.priceWei ?? "0") * BigInt(qty || 1))}
            </button>
          </div>
        </div>
      ) : null}

      {isOwner ? (
        <div className="flex flex-col gap-3">
          {item.transferable ? (
            <>
              <label className="text-xs tracking-wide text-ink-soft uppercase" htmlFor="list-price">
                List for sale ({NATIVE_SYMBOL} each)
              </label>
              <div className="flex gap-2">
                <input
                  id="list-price"
                  value={listPrice}
                  onChange={(event) => setListPrice(event.target.value)}
                  placeholder="0.02"
                  className="h-11 flex-1 border border-line px-3"
                />
                <input
                  value={listAmount}
                  onChange={(event) => setListAmount(event.target.value)}
                  className="h-11 w-20 border border-line px-3"
                  aria-label="List amount"
                />
                <button
                  type="button"
                  className="h-11 border border-ink px-4 text-sm"
                  onClick={() => setConfirm("list")}
                  disabled={busy}
                >
                  List
                </button>
              </div>
              <label className="text-xs tracking-wide text-ink-soft uppercase" htmlFor="transfer-to">
                Transfer
              </label>
              <div className="flex gap-2">
                <input
                  id="transfer-to"
                  value={transferTo}
                  onChange={(event) => setTransferTo(event.target.value)}
                  placeholder="0x…"
                  className="h-11 flex-1 border border-line px-3 font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={busy || !transferTo}
                  className="h-11 border border-line px-4 text-sm"
                  onClick={() =>
                    send("Transfer", () =>
                      writeContractAsync({
                        address: collectionAddress!,
                        abi: collectionAbi,
                        functionName: "safeTransferFrom",
                        args: [address!, transferTo as `0x${string}`, BigInt(item.tokenId!), BigInt(1), "0x"],
                      })
                    )
                  }
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft">This edition is non-transferable.</p>
          )}

          {canRedeem ? (
            <button
              type="button"
              className="h-11 bg-ink text-sm font-medium text-paper"
              onClick={() => setConfirm("redeem")}
              disabled={busy}
            >
              Redeem utility
            </button>
          ) : null}

          {accessQuery.data?.expired ? (
            <p className="text-sm text-warn">This utility has expired.</p>
          ) : null}
          {accessQuery.data && item.utilityType === "REDEEMABLE" && accessQuery.data.unredeemedAmount === BigInt(0) ? (
            <p className="text-sm text-ink-soft">All units in this wallet are redeemed.</p>
          ) : null}
        </div>
      ) : null}

      {item.listingId && isOwner ? (
        <button
          type="button"
          className="h-11 border border-line text-sm"
          disabled={busy}
          onClick={() =>
            send("Cancel listing", () =>
              writeContractAsync({
                address: marketplaceAddress!,
                abi: marketplaceAbi,
                functionName: "cancel",
                args: [BigInt(item.listingId!)],
              })
            )
          }
        >
          Cancel listing
        </button>
      ) : null}

      {hash ? (
        <a href={explorerTx(hash)} className="text-sm underline" target="_blank" rel="noreferrer">
          View transaction
        </a>
      ) : null}

      {confirm ? (
        <div
          className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setConfirm(null);
          }}
        >
          <div className="w-full max-w-md animate-scale-in border border-ink bg-paper p-6 shadow-[10px_10px_0_0_var(--ink)]">
            <h2 className="display text-3xl">Confirm {confirm}</h2>
            <p className="mt-3 text-sm text-ink-soft">
              {confirm === "buy"
                ? `Buy ${qty} × ${item.name} for ${formatEth(BigInt(item.priceWei ?? "0") * BigInt(qty || 1))}. Success is shown only after the receipt.`
                : confirm === "redeem"
                  ? "The contract will record redemption for this wallet. Off-chain benefits still need the issuer or an operator."
                  : "The marketplace must be approved to move this collectible. Tokens stay in your wallet until a buyer pays."}
            </p>
            <div className="mt-6 flex gap-2">
              <button type="button" className="h-11 flex-1 border border-line" onClick={() => setConfirm(null)}>
                Back
              </button>
              <button
                type="button"
                className="h-11 flex-1 bg-accent text-paper-raised"
                disabled={busy}
                onClick={async () => {
                  if (confirm === "buy" && item.listingId && item.priceWei) {
                    const value = BigInt(item.priceWei) * BigInt(qty);
                    await send("Purchase", () =>
                      writeContractAsync({
                        address: marketplaceAddress!,
                        abi: marketplaceAbi,
                        functionName: "buy",
                        args: [BigInt(item.listingId!), BigInt(qty)],
                        value,
                      })
                    );
                  }
                  if (confirm === "redeem" && item.tokenId) {
                    await send("Redemption", () =>
                      writeContractAsync({
                        address: redemptionAddress!,
                        abi: redemptionAbi,
                        functionName: "redeem",
                        args: [BigInt(item.tokenId!), BigInt(1)],
                      })
                    );
                  }
                  if (confirm === "list" && item.tokenId && address) {
                    await send("Listing", async () => {
                      const approved = await publicClient!.readContract({
                        address: collectionAddress!,
                        abi: collectionAbi,
                        functionName: "isApprovedForAll",
                        args: [address, marketplaceAddress!],
                      });
                      if (!approved) {
                        const approvalHash = await writeContractAsync({
                          address: collectionAddress!,
                          abi: collectionAbi,
                          functionName: "setApprovalForAll",
                          args: [marketplaceAddress!, true],
                        });
                        await waitForTransactionReceipt(publicClient!, { hash: approvalHash });
                      }
                      return writeContractAsync({
                        address: marketplaceAddress!,
                        abi: marketplaceAbi,
                        functionName: "list",
                        args: [BigInt(item.tokenId!), BigInt(listAmount || "1"), parseEther(listPrice as `${number}`)],
                      });
                    });
                  }
                }}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin border-2 border-paper-raised border-t-transparent" aria-hidden="true" />
                    Waiting…
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
