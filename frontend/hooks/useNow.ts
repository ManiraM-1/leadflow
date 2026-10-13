"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

// One shared clock for the whole page, however many components read it.
let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === null) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * The current time, refreshed every 30 s so "5 min ago" and overdue highlighting stay
 * correct while the page is open. Returns null during server rendering, where there
 * is no meaningful "now" for the user.
 */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}
