"use client";

import { useEffect, useRef } from "react";

/**
 * `warnOnUnsavedChanges` (used by every `CustomForm`) is `beforeunload`-
 * only and per-form — blind to a pending debounced queue write. This adds
 * a capture-phase document click listener intercepting internal
 * `a[href]` navigation while `isPending` is true (Next 14's App Router
 * exposes no navigation event, so this plus `beforeunload` is the
 * complete-enough combination the architecture plan calls for), and its
 * default action on confirm is "flush pending writes, then go" — never
 * a silent discard, since the queue's writes are already in flight or
 * about to be, not merely typed-but-unsent form state.
 */
export function useUnsavedChangesGuard(isPending: boolean, flush: () => Promise<unknown>) {
  const isPendingRef = useRef(isPending);
  isPendingRef.current = isPending;

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (!isPendingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    async function handleClick(event: MouseEvent): Promise<void> {
      if (!isPendingRef.current) return;
      const link = (event.target as HTMLElement)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      event.preventDefault();
      event.stopPropagation();
      await flush();
      window.location.assign(href);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [flush]);
}
