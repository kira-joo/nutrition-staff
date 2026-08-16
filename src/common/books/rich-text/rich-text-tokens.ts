/**
 * The controlled vocabulary for selection-level formatting.
 *
 * Every value the author can apply is a TOKEN, never a CSS value. The
 * persisted JSON stores `"size-14"` / `"primary"`, and each renderer turns
 * that into a class — so the actual pt/colour lives in the print template,
 * in one place, and Staff Preview, the client Flipbook and the PDF cannot
 * drift from each other. It also keeps the server validator doing set
 * membership instead of parsing units or colours, which is what makes
 * `style="font-size:17.3px;color:#abc123"` structurally impossible rather
 * than merely discouraged.
 *
 * Hand-synced with nutrition-client's copy of this file, exactly like the
 * template CSS and the renderer already are.
 */

/** Author-facing point sizes. The token is the wire format; the pt value lives in the template CSS. */
export const FONT_SIZE_VALUES = [10, 11, 12, 14, 16, 18, 20, 24] as const;

export type FontSizeToken = `size-${(typeof FONT_SIZE_VALUES)[number]}`;

export const FONT_SIZE_TOKENS: readonly FontSizeToken[] = FONT_SIZE_VALUES.map((value) => `size-${value}` as FontSizeToken);

/**
 * Brand-safe text colours. Deliberately a short list drawn from the book
 * template's own palette — no free-form hex, so an author cannot pick
 * something that fails contrast or clashes with the printed page.
 */
export const TEXT_COLOR_TOKENS = ["ink", "primary", "primary-dark", "muted", "accent"] as const;

export type TextColorToken = (typeof TEXT_COLOR_TOKENS)[number];

/**
 * Highlight colours. `yellow` is the historical default: a highlight mark
 * with NO `color` attr at all — every already-published Edition — renders
 * identically to this, which is what keeps old documents byte-compatible.
 */
export const HIGHLIGHT_COLOR_TOKENS = ["yellow", "green", "blue", "pink"] as const;

export type HighlightColorToken = (typeof HIGHLIGHT_COLOR_TOKENS)[number];

export const DEFAULT_HIGHLIGHT_COLOR: HighlightColorToken = "yellow";

export function isFontSizeToken(value: unknown): value is FontSizeToken {
  return typeof value === "string" && (FONT_SIZE_TOKENS as readonly string[]).includes(value);
}

export function isTextColorToken(value: unknown): value is TextColorToken {
  return typeof value === "string" && (TEXT_COLOR_TOKENS as readonly string[]).includes(value);
}

export function isHighlightColorToken(value: unknown): value is HighlightColorToken {
  return typeof value === "string" && (HIGHLIGHT_COLOR_TOKENS as readonly string[]).includes(value);
}

/**
 * The token -> visual value maps. THIS is the single source of truth for
 * what a token looks like: the Book template CSS and the live Tiptap
 * editor CSS are both generated from these maps by `buildRichTextMarkCss`,
 * so what an author sees while editing and what the PDF prints cannot
 * drift apart. Nothing hand-copies these values anywhere.
 */
export const FONT_SIZE_PT: Readonly<Record<FontSizeToken, number>> = Object.fromEntries(
  FONT_SIZE_VALUES.map((value) => [`size-${value}`, value])
) as Record<FontSizeToken, number>;

export const TEXT_COLOR_VALUE: Readonly<Record<TextColorToken, string>> = {
  ink: "#1c1c1c",
  primary: "#2f6f4f",
  "primary-dark": "#1f4d37",
  muted: "#5b5b5b",
  accent: "#b08d4f",
};

export const HIGHLIGHT_COLOR_VALUE: Readonly<Record<HighlightColorToken, string>> = {
  yellow: "#fdf1d6",
  green: "#dff0e0",
  blue: "#dde9f7",
  pink: "#f8dde6",
};

/**
 * Emits the mark rules for a given selector scope. `scope` is "" for the
 * Book template (bare global classes, as the rendered page HTML expects)
 * and ".book-rich-text-editor " for the editor, which keeps the editor's
 * copy from leaking into the surrounding staff UI.
 *
 * The bare `.book-highlight` rule is emitted first and unqualified so a
 * highlight mark with no colour attr — every Edition published before
 * colours existed — keeps the historical yellow with no extra selector.
 */
export function buildRichTextMarkCss(scope = ""): string {
  const sizes = FONT_SIZE_TOKENS.map((token) => `${scope}.book-text-${token} { font-size: ${FONT_SIZE_PT[token]}pt; }`).join("\n");
  const textColors = TEXT_COLOR_TOKENS.map((token) => `${scope}.book-text-color-${token} { color: ${TEXT_COLOR_VALUE[token]}; }`).join("\n");
  const highlights = HIGHLIGHT_COLOR_TOKENS.map(
    (token) => `${scope}.book-highlight--${token} { background: ${HIGHLIGHT_COLOR_VALUE[token]}; }`
  ).join("\n");
  return [
    `${scope}.book-highlight { background: ${HIGHLIGHT_COLOR_VALUE[DEFAULT_HIGHLIGHT_COLOR]}; padding: 0 1mm; }`,
    highlights,
    sizes,
    textColors,
  ].join("\n");
}
