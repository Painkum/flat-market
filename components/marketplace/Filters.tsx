"use client";

import { CATEGORY_LABELS, UTILITY_LABELS } from "@/lib/demo-data";
import { CATEGORIES, UTILITY_TYPES, type Category, type UtilityType } from "@/lib/types";
import { cx } from "@/lib/utils/format";

export type MarketFilters = {
  q: string;
  category: string;
  utility: string;
  sort: string;
  min: string;
  max: string;
  availability: string;
};

export const DEFAULT_FILTERS: MarketFilters = {
  q: "",
  category: "all",
  utility: "all",
  sort: "newest",
  min: "",
  max: "",
  availability: "all",
};

const field =
  "h-11 w-full border border-line bg-paper-raised px-3 text-sm outline-none transition-colors duration-200 focus:border-ink";
const label = "flex flex-col gap-1.5 text-[11px] tracking-[0.14em] text-ink-soft uppercase";

/** Horizontal category pills above the results. */
export function CategoryPills({
  value,
  counts,
  onChange,
}: {
  value: string;
  counts: Record<string, number>;
  onChange: (category: string) => void;
}) {
  const all = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {(["all", ...CATEGORIES] as const).map((category) => {
        const active = value === category;
        const n = category === "all" ? all : counts[category] ?? 0;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            aria-pressed={active}
            className={cx(
              "inline-flex h-10 shrink-0 items-center gap-2 border px-4 text-sm transition-colors duration-200",
              active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
            )}
          >
            {category === "all" ? "Everything" : CATEGORY_LABELS[category as Category]}
            <span className={cx("font-mono text-[11px]", active ? "text-paper/70" : "text-ink-soft")}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FilterBar({
  value,
  onChange,
}: {
  value: MarketFilters;
  onChange: (next: MarketFilters) => void;
}) {
  function set<K extends keyof MarketFilters>(key: K, next: MarketFilters[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.4fr_1fr]">
      <label className={label}>
        Search
        <span className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className={cx(field, "pl-9 normal-case tracking-normal")}
            value={value.q}
            onChange={(event) => set("q", event.target.value)}
            placeholder="Name, collection, utility…"
            type="search"
          />
        </span>
      </label>
      <label className={label}>
        Utility
        <select className={field} value={value.utility} onChange={(event) => set("utility", event.target.value)}>
          <option value="all">All utilities</option>
          {UTILITY_TYPES.map((utility) => (
            <option key={utility} value={utility}>
              {UTILITY_LABELS[utility as UtilityType]}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Availability
        <select className={field} value={value.availability} onChange={(event) => set("availability", event.target.value)}>
          <option value="all">Any</option>
          <option value="listed">Listed</option>
          <option value="sold">Sold out</option>
        </select>
      </label>
      <fieldset className={label}>
        <legend className="mb-1.5">Price (ETH)</legend>
        <div className="flex items-center gap-2">
          <input
            className={field}
            value={value.min}
            onChange={(event) => set("min", event.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="Min"
            aria-label="Minimum price"
          />
          <span className="text-ink-soft">–</span>
          <input
            className={field}
            value={value.max}
            onChange={(event) => set("max", event.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="Max"
            aria-label="Maximum price"
          />
        </div>
      </fieldset>
      <label className={label}>
        Sort
        <select className={field} value={value.sort} onChange={(event) => set("sort", event.target.value)}>
          <option value="newest">Newest</option>
          <option value="low">Price: low → high</option>
          <option value="high">Price: high → low</option>
          <option value="scarce">Scarcest first</option>
        </select>
      </label>
    </div>
  );
}

/** Removable chips for each active filter. */
export function ActiveFilters({
  value,
  onChange,
}: {
  value: MarketFilters;
  onChange: (next: MarketFilters) => void;
}) {
  const chips: { key: keyof MarketFilters; text: string }[] = [];
  if (value.q) chips.push({ key: "q", text: `“${value.q}”` });
  if (value.category !== "all") chips.push({ key: "category", text: CATEGORY_LABELS[value.category as Category] ?? value.category });
  if (value.utility !== "all") chips.push({ key: "utility", text: UTILITY_LABELS[value.utility as UtilityType] ?? value.utility });
  if (value.availability !== "all") chips.push({ key: "availability", text: value.availability === "listed" ? "Listed" : "Sold out" });
  if (value.min) chips.push({ key: "min", text: `≥ ${value.min} ETH` });
  if (value.max) chips.push({ key: "max", text: `≤ ${value.max} ETH` });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange({ ...value, [chip.key]: DEFAULT_FILTERS[chip.key] })}
          className="inline-flex h-8 animate-scale-in items-center gap-2 border border-ink bg-paper-raised px-3 text-xs transition-colors duration-200 hover:bg-ink hover:text-paper"
          aria-label={`Remove filter ${chip.text}`}
        >
          {chip.text}
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_FILTERS, sort: value.sort })}
        className="h-8 px-2 text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
