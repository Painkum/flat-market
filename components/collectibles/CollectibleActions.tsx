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
      <div className="border border-line p-5">
        <p className="text-sm text-ink-soft">
          This is labeled demo content. It is not an on-chain listing. Deploy the contracts and mint a live edition to buy, list, or redeem.
        </p>
      </div>
    );
  }

  if (!contractsConfigured || !item.tokenId) {
    return (
      <div className="border border-line p-5 text-sm text-ink-soft">
        Contract addresses are missing. Set them in `.env.local` after deploying to Robinhood Chain testnet.
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="border border-line p-5 text-sm">Connect a wallet to buy, list, transfer, or redeem.</div>
    );
  }

  if (chainId !== TARGET_CHAIN_ID) {
    return <div className="border border-accent p-5 text-sm">Switch to Robinhood Chain testnet to continue.</div>;
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
    <div className="flex flex-col gap-4 border border-line p-5">
      {canBuy ? (
        <div>
          <label className="text-xs tracking-wide text-ink-soft uppercase" htmlFor="qty">
            Quantity
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="qty"
              type="number"
              min={1}
              max={maxBuy}
              value={qty}
              onChange={(event) => setQty(Number(event.target.value))}
              className="h-11 w-24 border border-line bg-paper-raised px-3"
            />
            <button
              type="button"
              disabled={busy || isPending}
              onClick={() => setConfirm("buy")}
              className="h-11 flex-1 bg-accent text-sm font-medium text-paper-raised transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md border border-line bg-paper p-6">
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
                {busy ? "Waiting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
