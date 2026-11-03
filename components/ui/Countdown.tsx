"use client";

import { useEffect, useState } from "react";

function parts(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return { d, h, m, s };
}

/** Live countdown to a unix timestamp (seconds). Renders nothing until mounted to avoid hydration drift. */
export function Countdown({
  to,
  compact = false,
  className,
}: {
  to: number;
  compact?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now() / 1000);
    const id = window.setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now === null) return <span className={className}>&nbsp;</span>;

  const left = to - now;
  if (left <= 0) return <span className={className}>Expired</span>;

  const { d, h, m, s } = parts(left);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <span className={className}>
        {d > 0 ? `${d}d ${h}h left` : `${pad(h)}:${pad(m)}:${pad(s)} left`}
      </span>
    );
  }

  return (
    <span className={className} aria-live="off">
      <span className="grid grid-cols-4 gap-2 text-center">
        {[
          [d, "days"],
          [h, "hrs"],
          [m, "min"],
          [s, "sec"],
        ].map(([value, label]) => (
          <span key={label} className="border border-line bg-paper px-2 py-2">
            <span className="block font-mono text-xl tabular-nums">{pad(value as number)}</span>
            <span className="block text-[10px] tracking-[0.16em] text-ink-soft uppercase">{label}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
