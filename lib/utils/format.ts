import { formatEther, parseEther } from "viem";
import { NATIVE_SYMBOL } from "@/lib/web3/chain";

export function shortAddress(value?: string) {
  if (!value) return "—";
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function formatEth(wei?: string | bigint) {
  if (wei === undefined) return "Unlisted";
  const value = typeof wei === "bigint" ? wei : BigInt(wei);
  const formatted = Number(formatEther(value));
  if (formatted === 0) return `0 ${NATIVE_SYMBOL}`;
  if (formatted < 0.0001) return `<0.0001 ${NATIVE_SYMBOL}`;
  return `${formatted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${NATIVE_SYMBOL}`;
}

export function parseEthInput(value: string): bigint {
  return parseEther(value as `${number}`);
}

export function supplyLabel(minted: number, max: number) {
  return `${minted} / ${max}`;
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
