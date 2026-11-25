import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** The site's origin (https://...) in the browser, or an empty string while rendering on the server. */
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
