"use client";

import { CATEGORY_LABELS } from "@/lib/demo-data";
import { CATEGORIES, UTILITY_TYPES } from "@/lib/types";
import { UTILITY_LABELS } from "@/lib/demo-data";

type Filters = {
  q: string;
  category: string;
  utility: string;
  sort: string;
  min: string;
  max: string;
  availability: string;
};

export function FilterBar({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
}) {
  function set<K extends keyof Filters>(key: K, next: Filters[K]) {
    onChange({ ...value, [key]: next });
  }

  const field = "h-11 border border-line bg-paper-raised px-3 text-sm";

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <label className="flex flex-col gap-1 text-xs tracking-wide text-ink-soft uppercase">
        Search
        <input
          className={field}
          value={value.q}
          onChange={(event) => set("q", event.target.value)}
          placeholder="Name or collection"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs tracking-wide text-ink-soft uppercase">
        Category
        <select className={field} value={value.category} onChange={(event) => set("category", event.target.value)}>
          <option value="all">All</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs tracking-wide text-ink-soft uppercase">
        Utility
        <select className={field} value={value.utility} onChange={(event) => set("utility", event.target.value)}>
          <option value="all">All</option>
          {UTILITY_TYPES.map((utility) => (
            <option key={utility} value={utility}>
              {UTILITY_LABELS[utility]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs tracking-wide text-ink-soft uppercase">
        Availability
        <select
          className={field}
          value={value.availability}
          onChange={(event) => set("availability", event.target.value)}
        >
          <option value="all">All</option>
          <option value="listed">Listed</option>
          <option value="sold">Sold out</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs tracking-wide text-ink-soft uppercase">
        Min ETH
        <input className={field} value={value.min} onChange={(event) => set("min", event.target.value)} inputMode="decimal" />
      </label>
      <label className="flex flex-col gap-1 text-xs tracking-wide text-ink-soft uppercase">
        Sort
        <select className={field} value={value.sort} onChange={(event) => set("sort", event.target.value)}>
          <option value="newest">Newest</option>
          <option value="low">Lowest price</option>
          <option value="high">Highest price</option>
        </select>
      </label>
    </div>
  );
}
