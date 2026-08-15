import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import { BookBlockType } from "../enums";
import type { RichTextDoc } from "../books/rich-text/rich-text-doc.interface";

/**
 * Shared by every block type — mirrors the Campaign block pattern
 * (`{id, order, ...}`), plus the two pagination hints the paginator will
 * consume later (`keepWithNext`/`avoidBreakInside`, carried forward from
 * Phase A) and `citationIds` (letting any block cite `book.references`
 * without needing a dedicated citation variant of every type).
 */
interface BookBlockBase {
  id: string;
  order: number;
  /** Pagination hint for the future paginator: never let this block start alone at the bottom of a page. Not yet enforced (no paginator exists), but part of the persisted shape from day one so no later migration is needed. */
  keepWithNext?: boolean;
  /** Pagination hint: never split this block across two pages. */
  avoidBreakInside?: boolean;
  citationIds?: string[];
}

export interface HeadingBlock extends BookBlockBase {
  type: BookBlockType.HEADING;
  text: string;
}

export interface SubheadingBlock extends BookBlockBase {
  type: BookBlockType.SUBHEADING;
  text: string;
}

export interface ParagraphBlock extends BookBlockBase {
  type: BookBlockType.PARAGRAPH;
  richText: RichTextDoc;
}

export interface ImageBlock extends BookBlockBase {
  type: BookBlockType.IMAGE;
  image: ImageAsset | null;
  /** Image + Image-with-caption collapse into one type (deliberate narrowing, see BOOK_PLAN notes) — an empty caption just renders no caption. */
  caption?: string;
}

export interface BulletListBlock extends BookBlockBase {
  type: BookBlockType.BULLET_LIST;
  items: string[];
}

export interface NumberedListBlock extends BookBlockBase {
  type: BookBlockType.NUMBERED_LIST;
  items: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistBlock extends BookBlockBase {
  type: BookBlockType.CHECKLIST;
  items: ChecklistItem[];
}

export interface QuoteBlock extends BookBlockBase {
  type: BookBlockType.QUOTE;
  richText: RichTextDoc;
  attribution?: string;
}

export interface TipBlock extends BookBlockBase {
  type: BookBlockType.TIP;
  title?: string;
  richText: RichTextDoc;
}

export interface NoteBlock extends BookBlockBase {
  type: BookBlockType.NOTE;
  title?: string;
  richText: RichTextDoc;
}

export interface WarningBlock extends BookBlockBase {
  type: BookBlockType.WARNING;
  title?: string;
  richText: RichTextDoc;
}

export interface TableBlock extends BookBlockBase {
  type: BookBlockType.TABLE;
  headers: string[];
  rows: string[][];
}

export interface DividerBlock extends BookBlockBase {
  type: BookBlockType.DIVIDER;
}

export interface PageBreakBlock extends BookBlockBase {
  type: BookBlockType.PAGE_BREAK;
}

export interface QrLinkBlock extends BookBlockBase {
  type: BookBlockType.QR_LINK;
  label?: string;
  destination: string;
}

export interface RecipeRefBlock extends BookBlockBase {
  type: BookBlockType.RECIPE_REF;
  recipeId: string;
  displayTitle?: string;
}

export interface CitationBlock extends BookBlockBase {
  type: BookBlockType.CITATION;
  referenceId: string;
}

/**
 * Pins its content to the bottom of whatever physical page it lands on
 * (above the folio), reserving that space from the paginator's normal
 * packing rather than overlaying it — see `paginate-book.browser.ts`'s
 * `"pageFooterNote"` FragmentKind branch. Generic and reusable (not
 * specific to the Copyright/Disclaimer footer, which stays baked into
 * `renderTitlePage` since the title page is a `singlePage` fragment this
 * block never competes with).
 */
export interface PageFooterNoteBlock extends BookBlockBase {
  type: BookBlockType.PAGE_FOOTER_NOTE;
  richText: RichTextDoc;
}

/** Union of every block type — a new block type adds a member here (and to the registry/DTO/asset-field dispatch tables). */
export type BookBlock =
  | HeadingBlock
  | SubheadingBlock
  | ParagraphBlock
  | ImageBlock
  | BulletListBlock
  | NumberedListBlock
  | ChecklistBlock
  | QuoteBlock
  | TipBlock
  | NoteBlock
  | WarningBlock
  | TableBlock
  | DividerBlock
  | PageBreakBlock
  | QrLinkBlock
  | RecipeRefBlock
  | CitationBlock
  | PageFooterNoteBlock;

/** Block types that add instantly with no editor modal — both are contentless, so there is nothing to fill in. */
export const IMMEDIATE_BLOCK_TYPES: readonly BookBlockType[] = [BookBlockType.PAGE_BREAK, BookBlockType.DIVIDER];
