import { Mark, mergeAttributes } from "@tiptap/core";

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

export const HighlightMark = Mark.create({
  name: "highlight",
  parseHTML: () => [{ tag: "mark" }],
  renderHTML: ({ HTMLAttributes }) => ["mark", mergeAttributes(HTMLAttributes, { class: "book-highlight" }), 0],
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
