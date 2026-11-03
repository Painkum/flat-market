import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">{eyebrow}</p>
        <h1 className="display mt-2 text-6xl leading-none sm:text-7xl">{title}</h1>
        {children ? <div className="mt-4 max-w-2xl text-ink-soft">{children}</div> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}
