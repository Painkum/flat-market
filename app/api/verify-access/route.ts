import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { TARGET_CHAIN } from "@/lib/web3/chain";
import { redemptionAddress } from "@/lib/contracts/addresses";
import { redemptionAbi } from "@/lib/contracts/abis";
import { UTILITY_TYPES } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet") ?? "";
  const tokenId = url.searchParams.get("tokenId") ?? "";

  if (!isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }
  if (!/^\d+$/.test(tokenId)) {
    return NextResponse.json({ error: "Invalid tokenId." }, { status: 400 });
  }
  if (!redemptionAddress) {
    return NextResponse.json(
      { error: "Redemption contract is not configured.", missing: "NEXT_PUBLIC_REDEMPTION_ADDRESS" },
      { status: 501 }
    );
  }

  const client = createPublicClient({
    chain: TARGET_CHAIN,
    transport: http(TARGET_CHAIN.rpcUrls.default.http[0]),
  });

  const result = await client.readContract({
    address: redemptionAddress,
    abi: redemptionAbi,
    functionName: "verifyCollectibleAccess",
    args: [wallet, BigInt(tokenId)],
  });

  return NextResponse.json({
    wallet,
    tokenId,
    eligible: result.eligible,
    ownsToken: result.ownsToken,
    expired: result.expired,
    balance: result.balance.toString(),
    redeemedAmount: result.redeemedAmount.toString(),
    unredeemedAmount: result.unredeemedAmount.toString(),
    utilityType: UTILITY_TYPES[result.utilityType] ?? "COLLECTIBLE",
    expiry: Number(result.expiry),
  });
}
