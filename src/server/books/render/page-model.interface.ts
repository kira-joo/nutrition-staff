/**
 * Type-only — safe to import into `paginate-book.browser.ts` (see that
 * file's header comment on why it must stay import-free at the value
 * level for `Function.prototype.toString()` inlining to be faithful).
 */

import type { RichTextMark } from "src/common/books/rich-text/rich-text-doc.interface";

export type FragmentKind = "content" | "chapterOpener" | "singlePage" | "tocReservation" | "pageBreakMarker" | "pageFooterNote";

/** One contiguous run of identically-marked text — the same granularity a ProseMirror "text" node already has. */
export interface StreamFragmentRun {
  text: string;
  marks: RichTextMark[];
}

/** One `<p>` worth of runs. A PARAGRAPH block's `richText` doc can hold more than one of these (the user can press Enter inside one block); `richTextParagraphs` preserves that structure so a mid-block page split never collapses multiple paragraphs into one or drops the marks on either side of the cut. */
export interface StreamFragmentParagraph {
  runs: StreamFragmentRun[];
}

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
  /** Only set when `splittable === "paragraph"` — the mark-preserving source the paginator splits from. See `richTextToParagraphRuns`. */
  richTextParagraphs?: StreamFragmentParagraph[];
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
  /** `label` is the chapter's dynamic ordinal ("الفصل الأول", ...) — computed by the caller from the chapter's position in the FULL (unfiltered) chapter list; see `chapter-label.ts`. */
  tocChapters: { chapterId: string; title: string; tocTitle?: string; label: string }[];
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
  label: string;
  pageNumber: number | null;
}

export interface PaginationResult {
  pageCount: number;
  pages: RenderedPage[];
  toc: TocResultEntry[];
  warnings: PaginationWarning[];
}
