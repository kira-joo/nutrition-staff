/**
 * The locked-down ProseMirror JSON shape Tiptap is configured to produce
 * (see the editor's `extensions` list and `assert-valid-rich-text-doc.ts`,
 * which is the actual source of truth — this interface is a convenience
 * mirror of that allow-list, not the enforcement point itself).
 *
 * Deliberately NOT a general ProseMirror doc. Size and colour exist only
 * as CONTROLLED TOKENS (see rich-text-tokens.ts) resolved to classes by the
 * template, never as CSS values — so the schema itself, not editor
 * restraint, is what keeps the print template's visual language intact.
 * No font family, margin or alignment marks exist at all.
 */
import type { FontSizeToken, HighlightColorToken, TextColorToken } from "./rich-text-tokens";

export type RichTextMarkType = "bold" | "italic" | "highlight" | "link" | "citation" | "fontSize" | "textColor";

export interface RichTextMark {
  type: RichTextMarkType;
  /** `href` for "link" (restricted to https:/http:// paths — see the validator); `referenceId` for "citation" (must exist in `book.references`). */
  attrs?: {
    href?: string;
    referenceId?: string;
    /** "highlight" (optional — absent/null means the historical yellow) and "textColor" (required). Always a token, never CSS. */
    color?: HighlightColorToken | TextColorToken | null;
    /** "fontSize". Always a token, never a CSS length. */
    size?: FontSizeToken | null;
  };
}

export interface RichTextNode {
  /** "text" nodes are leaves (`text` + optional `marks`); "paragraph" nodes are containers (`content`). No other node types are permitted. */
  type: "paragraph" | "text";
  text?: string;
  marks?: RichTextMark[];
  content?: RichTextNode[];
}

export interface RichTextDoc {
  type: "doc";
  content: RichTextNode[];
}

export const EMPTY_RICH_TEXT_DOC: RichTextDoc = { type: "doc", content: [{ type: "paragraph", content: [] }] };
