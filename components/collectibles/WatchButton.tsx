"use client";

import { useState } from "react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cx } from "@/lib/utils/format";

export function WatchButton({
  id,
  name,
  variant = "icon",
  className,
}: {
  id: string;
  name: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { has, toggle } = useWatchlist();
  const saved = has(id);
  const [pop, setPop] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from watchlist` : `Save ${name} to watchlist`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(id);
        setPop(true);
        window.setTimeout(() => setPop(false), 300);
      }}
      className={cx(
        "inline-flex items-center justify-center gap-2 transition-colors duration-200",
        variant === "icon"
          ? "h-9 w-9 border border-line bg-paper-raised/90 backdrop-blur-sm hover:border-ink"
          : "h-11 border border-line px-4 text-sm hover:border-ink",
        saved && "border-accent text-accent hover:border-accent",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={cx("h-4 w-4 transition-transform duration-300", pop && "scale-125")}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 20.5s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z" />
      </svg>
      {variant === "full" ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
