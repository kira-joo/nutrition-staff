import { BookMarginPreset, BookPageSize } from "src/common/enums";

/** Exact A5/A4 geometry in mm — CSS itself does the mm→px conversion (`width: 148mm`), never a hand-computed px approximation, which is what the sub-pixel-overflow risk in the architecture notes is about. */
export const PAGE_SIZE_MM: Record<BookPageSize, { widthMm: number; heightMm: number }> = {
  [BookPageSize.A5]: { widthMm: 148, heightMm: 210 },
  [BookPageSize.A4]: { widthMm: 210, heightMm: 297 },
};

/** Top/bottom margins are sized to comfortably contain the running-head and folio bands inside them — there is no separate reserved header/footer region. */
export const MARGIN_PRESET_MM: Record<BookMarginPreset, { topMm: number; bottomMm: number; outerMm: number }> = {
  [BookMarginPreset.COMPACT]: { topMm: 14, bottomMm: 16, outerMm: 12 },
  [BookMarginPreset.STANDARD]: { topMm: 16, bottomMm: 18, outerMm: 14 },
  [BookMarginPreset.GENEROUS]: { topMm: 20, bottomMm: 22, outerMm: 18 },
};

export interface ResolvedGeometry {
  pageSize: BookPageSize;
  widthMm: number;
  heightMm: number;
  topMm: number;
  bottomMm: number;
  outerMm: number;
  gutterMm: number;
  /** Content-box width for a LEFT page (gutter on the right) vs a RIGHT page (gutter on the left) is identical in mm — only which physical side the gutter sits on differs, handled purely in CSS via `[data-side]`. */
  contentWidthMm: number;
  contentHeightMm: number;
}

export function resolveGeometry(pageSize: BookPageSize, marginPreset: BookMarginPreset, gutterMm: number): ResolvedGeometry {
  const size = PAGE_SIZE_MM[pageSize];
  const margins = MARGIN_PRESET_MM[marginPreset];
  return {
    pageSize,
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    topMm: margins.topMm,
    bottomMm: margins.bottomMm,
    outerMm: margins.outerMm,
    gutterMm,
    contentWidthMm: size.widthMm - margins.outerMm - gutterMm,
    contentHeightMm: size.heightMm - margins.topMm - margins.bottomMm,
  };
}
