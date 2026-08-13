"use client";

import { useCallback, useRef, useState } from "react";
import type { Book } from "src/common/interfaces/book.interface";

/**
 * The three-layer anti-race design from the architecture plan, layer 2:
 * a single-flight queue per book. Every content mutation (add/replace/
 * remove/reorder/duplicate/move block or chapter, reference edits, and
 * the debounced chapter-header autosave) goes through `enqueue()` here —
 * never called directly against a mutation hook — so:
 *
 * 1. Only one request is ever in flight for this book at a time (FIFO,
 *    not concurrent) — a reorder fired right after a pending debounced
 *    autosave WAITS for that autosave to finish rather than racing it.
 * 2. `contentRevision` is tracked from each response and handed to the
 *    NEXT queued call automatically, so the client never has to
 *    remember to thread a fresh revision through by hand — the only way
 *    a 409 should ever happen is a genuine conflict from another tab or
 *    user (layer 1, the server's own `where: {contentRevision}` check).
 * 3. Reorder itself carries no content (layer 3, unchanged from the plan)
 *    — this hook only adds the serialization/revision-threading part.
 */
export function useBookContentQueue(initialBook: Book) {
  const [book, setBook] = useState(initialBook);
  const revisionRef = useRef(initialBook.contentRevision);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [pendingCount, setPendingCount] = useState(0);

  const enqueue = useCallback(<T,>(run: (expectedRevision: number) => Promise<T & Book>): Promise<T & Book> => {
    setPendingCount((count) => count + 1);
    const result = queueRef.current.then(() => run(revisionRef.current)).then(
      (updated) => {
        revisionRef.current = updated.contentRevision;
        setBook(updated);
        setPendingCount((count) => count - 1);
        return updated;
      },
      (error) => {
        setPendingCount((count) => count - 1);
        throw error;
      }
    );
    // Swallow the rejection on the SHARED chain (each caller still sees the real rejection via `result`) — otherwise one failed mutation would permanently wedge every later queued call.
    queueRef.current = result.catch(() => undefined);
    return result;
  }, []);

  /** Resolves once every currently-queued mutation has settled — the unsaved-changes guard awaits this before allowing navigation away. */
  const flush = useCallback(() => queueRef.current, []);

  return { book, setBook, enqueue, flush, isSaving: pendingCount > 0, pendingCount };
}
