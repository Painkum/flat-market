"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "flatmarket:watchlist";
const listeners = new Set<() => void>();
const EMPTY: string[] = [];
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: keep in memory for this tab */
  }
  listeners.forEach((listener) => listener());
}

function getServerSnapshot() {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Per-browser saved collectibles. Lives in localStorage and syncs across tabs. */
export function useWatchlist() {
  const ids = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((item) => item !== id) : [id, ...current]);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, has, toggle, count: ids.length };
}
