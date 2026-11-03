import { cx } from "@/lib/utils/format";

/** Thin bar showing how much of an edition has been minted. */
export function SupplyBar({
  minted,
  max,
  showLabel = true,
  className,
}: {
  minted: number;
  max: number;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((minted / max) * 100)) : 0;
  const left = Math.max(0, max - minted);
  const scarce = left > 0 && pct >= 80;

  return (
    <div className={cx("w-full", className)}>
      {showLabel ? (
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-ink-soft">
            {left === 0 ? "Fully minted" : scarce ? `Only ${left} left` : `${left} of ${max} left`}
          </span>
          <span className="font-mono tabular-nums">{pct}%</span>
        </div>
      ) : null}
      <div
        className="h-1 w-full overflow-hidden bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={minted}
        aria-label="Minted supply"
      >
        <div
          className={cx(
            "h-full origin-left transition-[width] duration-700 ease-out",
            left === 0 ? "bg-ink-soft" : scarce ? "bg-accent" : "bg-ink"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
