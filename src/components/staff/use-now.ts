"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

// One shared clock for every timer on screen. It only runs while something is subscribed.
const listeners = new Set<() => void>();
let snapshot = 0;
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    snapshot = Date.now();
    timer = window.setInterval(() => {
      snapshot = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

/**
 * The current time in milliseconds, refreshed every 30 seconds so waiting timers tick.
 * It is 0 while the page is rendered on the server, so nothing time-based is baked into the HTML.
 */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => 0,
  );
}
