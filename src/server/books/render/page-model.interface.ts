/**
 * Type-only — safe to import into `paginate-book.browser.ts` (see that
 * file's header comment on why it must stay import-free at the value
 * level for `Function.prototype.toString()` inlining to be faithful).
 */

export type FragmentKind = "content" | "chapterOpener" | "singlePage" | "tocReservation" | "pageBreakMarker";

export interface StreamFragment {
  id: string;
  kind: FragmentKind;
  html: string;
  chapterId: string | null;
  atomic: boolean;
  keepWithNext: boolean;
  forceNewPage: boolean;
  splittable: "paragraph" | "list" | "table" | false;
  degrade?: "scaleImage";
  plainText?: string;
  tableHeaderHtml?: string;
  tableRowsHtml?: string[];
  listItemsHtml?: string[];
  listTag?: "ul" | "ol";
  /** Only meaningful for `kind: "singlePage"` — which page-chrome class to render with, and whether it participates in folio numbering (cover/title/copyright/back-cover never do). */
  pageKind?: string;
  numbered?: boolean;
}

export interface PaginationInput {
  stream: StreamFragment[];
  contentBoxWidthPx: number;
  contentBoxHeightPx: number;
  pageNumberStart: number;
  tocEligibleCount: number;
  tocEntriesPerPage: number;
  tocChapters: { chapterId: string; title: string; tocTitle?: string }[];
  fontProbes: { family: string; weight: string; sampleText: string }[];
}

export interface RenderedPage {
  kind: string;
  chapterId: string | null;
  html: string;
  numbered: boolean;
  pageNumber: number | null;
}

export interface PaginationWarning {
  code: string;
  message: string;
}

export interface TocResultEntry {
  chapterId: string;
  title: string;
  pageNumber: number | null;
}

export interface PaginationResult {
  pageCount: number;
  pages: RenderedPage[];
  toc: TocResultEntry[];
  warnings: PaginationWarning[];
}
