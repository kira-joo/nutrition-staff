import { Mark, mergeAttributes } from "@tiptap/core";
import { DEFAULT_HIGHLIGHT_COLOR, isFontSizeToken, isHighlightColorToken, isTextColorToken } from "./rich-text-tokens";

/**
 * Hand-written marks instead of the official `@tiptap/extension-link`/
 * `-highlight` packages. Those ship extra attrs (`target`/`rel`/`class`
 * on Link; `color` on Highlight) that serialize into every mark's JSON
 * `attrs` even when unset — which `assert-valid-rich-text-doc.ts` would
 * then reject outright (it allow-lists an EXACT attrs shape per mark
 * type). Writing these five marks by hand guarantees the editor's
 * `getJSON()` output is byte-shape-identical to what the server allows,
 * with no configuration surface that could silently drift.
 */

export const BoldMark = Mark.create({
  name: "bold",
  parseHTML: () => [{ tag: "strong" }, { tag: "b" }],
  renderHTML: ({ HTMLAttributes }) => ["strong", mergeAttributes(HTMLAttributes), 0],
  addKeyboardShortcuts() {
    return { "Mod-b": () => this.editor.commands.toggleMark(this.name) };
  },
});

export const ItalicMark = Mark.create({
  name: "italic",
  parseHTML: () => [{ tag: "em" }, { tag: "i" }],
  renderHTML: ({ HTMLAttributes }) => ["em", mergeAttributes(HTMLAttributes), 0],
  addKeyboardShortcuts() {
    return { "Mod-i": () => this.editor.commands.toggleMark(this.name) };
  },
});

/**
 * `color` is a TOKEN (see rich-text-tokens.ts), never a CSS colour, and it
 * defaults to `null` rather than to "yellow" on purpose: a highlight with
 * no explicit colour must serialize as `attrs: { color: null }`, which the
 * validator treats identically to the attr-less marks in already-published
 * Editions. Defaulting to the token instead would silently rewrite every
 * old document's meaning on the next save.
 */
export const HighlightMark = Mark.create({
  name: "highlight",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-color"),
        renderHTML: (attributes) => (isHighlightColorToken(attributes.color) ? { "data-color": attributes.color } : {}),
      },
    };
  },
  parseHTML: () => [{ tag: "mark" }],
  renderHTML: ({ HTMLAttributes }) => {
    const color = isHighlightColorToken(HTMLAttributes["data-color"]) ? HTMLAttributes["data-color"] : DEFAULT_HIGHLIGHT_COLOR;
    return ["mark", mergeAttributes(HTMLAttributes, { class: `book-highlight book-highlight--${color}` }), 0];
  },
});

/** Selection-level size. Stores a token; the pt value lives in the template CSS so print and screen cannot disagree. */
export const FontSizeMark = Mark.create({
  name: "fontSize",
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-size"),
        renderHTML: (attributes) => (isFontSizeToken(attributes.size) ? { "data-size": attributes.size } : {}),
      },
    };
  },
  parseHTML: () => [{ tag: "span[data-size]" }],
  renderHTML: ({ HTMLAttributes }) => {
    const size = isFontSizeToken(HTMLAttributes["data-size"]) ? HTMLAttributes["data-size"] : null;
    return ["span", mergeAttributes(HTMLAttributes, size ? { class: `book-text-${size}` } : {}), 0];
  },
});

/** Selection-level colour, from the fixed brand palette. Same token-not-CSS rule as FontSizeMark. */
export const TextColorMark = Mark.create({
  name: "textColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-color"),
        renderHTML: (attributes) => (isTextColorToken(attributes.color) ? { "data-color": attributes.color } : {}),
      },
    };
  },
  parseHTML: () => [{ tag: "span[data-color]" }],
  renderHTML: ({ HTMLAttributes }) => {
    const color = isTextColorToken(HTMLAttributes["data-color"]) ? HTMLAttributes["data-color"] : null;
    return ["span", mergeAttributes(HTMLAttributes, color ? { class: `book-text-color-${color}` } : {}), 0];
  },
});

/** No custom `setLink`/`unsetLink` commands (that needs TS `Commands` interface augmentation to type-check cleanly) — the toolbar calls the generic `editor.chain().focus().setMark("link", { href }).run()` directly instead. */
export const LinkMark = Mark.create({
  name: "link",
  addAttributes() {
    return { href: { default: null } };
  },
  parseHTML: () => [{ tag: "a[href]" }],
  renderHTML: ({ HTMLAttributes }) => ["a", mergeAttributes(HTMLAttributes), 0],
});

export const CitationMark = Mark.create({
  name: "citation",
  addAttributes() {
    return { referenceId: { default: null } };
  },
  parseHTML: () => [{ tag: "sup[data-reference-id]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "sup",
    mergeAttributes(HTMLAttributes, { class: "book-citation", "data-reference-id": HTMLAttributes.referenceId }),
    0,
  ],
});
