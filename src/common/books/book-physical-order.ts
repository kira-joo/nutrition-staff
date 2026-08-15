/**
 * The RTL physical-book-order invariant, isolated to one module per the
 * approved architecture — every renderer (print template here, the
 * flipbook later in Phase H) imports this instead of hard-coding
 * left/right, so the binding direction can never drift between them.
 *
 * BINDING_EDGE = "right": a closed Arabic book has its spine at the
 * right. Opening it swings rightward, leaving the text block to the left
 * of the gutter — so page 1 is a LEFT-hand page, and odd pages sit on
 * the left / even pages sit on the right. This matches InDesign's own
 * right-to-left binding convention (page 1 alone on the left of the
 * first spread). Applied here as previously reasoned/approved; a full
 * physical-book verification against a real Arabic book is Phase H's
 * own gate (flipbook page-turn direction), not re-verified in Phase D,
 * which has no flipbook and only needs this for folio/running-head
 * placement in the print template.
 */
export const BINDING_EDGE = "right" as const;

export type PageSide = "left" | "right";

export function sideOf(pageNumber: number): PageSide {
  return pageNumber % 2 === 0 ? "right" : "left";
}

/** The folio (page number) always sits at the page's OUTER edge — away from the gutter — which is simply its own physical side. */
export function outerEdgeOf(side: PageSide): PageSide {
  return side;
}

/** The running head sits at the INNER edge, near the gutter — the opposite side from the folio. */
export function innerEdgeOf(side: PageSide): PageSide {
  return side === "left" ? "right" : "left";
}

export interface Spread {
  index: number;
  left: number | null;
  right: number | null;
}

/** Spread 0 is the closed book (cover alone, no left page). Spread s >= 1 pairs {right: 2s, left: 2s+1}. */
export function spreadFor(pageNumber: number): Spread {
  if (pageNumber <= 1) return { index: 0, left: null, right: null };
  const index = Math.floor(pageNumber / 2);
  return { index, left: index * 2 + 1, right: index * 2 };
}
