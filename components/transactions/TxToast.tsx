"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cx } from "@/lib/utils/format";

type Toast = {
  id: number;
  title: string;
  body?: string;
  tone: "info" | "ok" | "warn";
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const LIFETIME = 5200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), LIFETIME);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cx(
              "pointer-events-auto relative animate-toast-in overflow-hidden border bg-paper-raised text-sm text-ink shadow-[4px_4px_0_0_var(--ink)]",
              toast.tone === "ok" && "border-ok",
              toast.tone === "warn" && "border-accent",
              toast.tone === "info" && "border-ink"
            )}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className={cx(
                  "mt-1 h-2 w-2 shrink-0",
                  toast.tone === "ok" && "bg-ok",
                  toast.tone === "warn" && "bg-accent",
                  toast.tone === "info" && "animate-pulse bg-ink"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{toast.title}</p>
                {toast.body ? <p className="mt-1 text-ink-soft">{toast.body}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-mt-1 -mr-2 h-7 w-7 shrink-0 text-ink-soft hover:text-ink"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <div
              aria-hidden="true"
              className={cx(
                "h-0.5 origin-left",
                toast.tone === "ok" ? "bg-ok" : toast.tone === "warn" ? "bg-accent" : "bg-ink"
              )}
              style={{ animation: `toast-timer ${LIFETIME}ms linear forwards` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
