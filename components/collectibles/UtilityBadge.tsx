import type { CollectibleSource, UtilityType } from "@/lib/types";
import { UTILITY_LABELS } from "@/lib/demo-data";
import { cx } from "@/lib/utils/format";

export function UtilityBadge({
  utility,
  source,
}: {
  utility: UtilityType;
  source?: CollectibleSource;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="border border-ink px-2 py-0.5 text-[11px] tracking-[0.14em] uppercase">
        {UTILITY_LABELS[utility]}
      </span>
      {source === "demo" ? (
        <span className="border border-demo px-2 py-0.5 text-[11px] tracking-[0.14em] text-demo uppercase">
          Demo
        </span>
      ) : source === "onchain" ? (
        <span className="border border-ok px-2 py-0.5 text-[11px] tracking-[0.14em] text-ok uppercase">
          On-chain
        </span>
      ) : null}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cx(
        "border px-2 py-0.5 text-[11px] tracking-[0.14em] uppercase",
        status === "listed" && "border-ok text-ok",
        status === "sold-out" && "border-ink-soft text-ink-soft",
        status === "unlisted" && "border-line text-ink-soft",
        status === "unavailable" && "border-accent text-accent"
      )}
    >
      {status.replace("-", " ")}
    </span>
  );
}
