"use client";

import { useCallback, useEffect, useRef } from "react";

const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * Debounces a save callback — used for chapter header fields (title,
 * subtitle, intro, TOC title) edited inline in the Content tab, which
 * autosave rather than requiring an explicit Save click, per the
 * architecture plan's "per-block sub-resource requests, plus a debounced
 * autosave reusing the same endpoints." Block CONTENT edits (rich text,
 * tables, checklists, images) stay an explicit modal Save — every other
 * structured editor in this codebase (Campaign blocks, Doctor Profile
 * gallery items) already works that way, and nothing about locked-schema
 * rich text or a table grid benefits from saving on every keystroke.
 *
 * Always routes through the caller's own single-flight queue (`enqueue`),
 * so an autosave firing mid-flight of a structural mutation queues behind
 * it rather than racing it — this hook only owns the timer, not the
 * ordering guarantee.
 */
export function useDebouncedAutosave<T>(value: T, onSave: (value: T) => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const latestRef = useRef(value);
  const savedRef = useRef(value);
  latestRef.current = value;

  const flush = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (JSON.stringify(latestRef.current) === JSON.stringify(savedRef.current)) return;
    savedRef.current = latestRef.current;
    onSave(latestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSave]);

  useEffect(() => {
    if (JSON.stringify(value) === JSON.stringify(savedRef.current)) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { flush };
}
