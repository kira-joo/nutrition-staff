import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import { BookBlockType } from "src/common/enums";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";
import { escapeHtml, renderRichTextToHtml, richTextToPlainText } from "src/common/books/rich-text/render-rich-text";
import type { StreamFragment } from "../page-model.interface";

/**
 * Converts one persisted `BookBlock` into a paginator-ready fragment
 * using the TEMPLATE's own markup/classes (`template.css.ts`) — visually
 * unrelated to the staff editor's own block previews, which exist only
 * to help the doctor recognize a block while editing.
 *
 * Known limitation, stated plainly rather than hidden: if a PARAGRAPH
 * block's content is long enough to be split across a page boundary,
 * the paginator rebuilds the split continuation from plain text (see
 * `paginate-book.browser.ts`'s `splitParagraphToFit`), which does not
 * preserve inline bold/highlight/link/citation marks in that specific
 * continuation fragment. A paragraph that fits entirely on one page —
 * the common case for a single content block — keeps its full
 * formatting untouched.
 */
export function renderBlockToFragment(block: BookBlock, references: BookReference[]): StreamFragment {
  const base = {
    id: block.id,
    chapterId: null,
    keepWithNext: block.keepWithNext ?? false,
    forceNewPage: false,
  };

  switch (block.type) {
    case BookBlockType.HEADING:
      return { ...base, kind: "content", html: `<h2 class="book-heading">${escapeHtml(block.text)}</h2>`, atomic: true, splittable: false, keepWithNext: block.keepWithNext ?? true };
    case BookBlockType.SUBHEADING:
      return { ...base, kind: "content", html: `<h3 class="book-subheading">${escapeHtml(block.text)}</h3>`, atomic: true, splittable: false, keepWithNext: block.keepWithNext ?? true };
    case BookBlockType.PARAGRAPH:
      return {
        ...base,
        kind: "content",
        html: renderRichTextToHtml(block.richText),
        atomic: false,
        splittable: "paragraph",
        plainText: richTextToPlainText(block.richText),
      };
    case BookBlockType.IMAGE:
      return {
        ...base,
        kind: "content",
        html: renderImageBlock(block.image, block.caption),
        atomic: true,
        splittable: false,
        degrade: "scaleImage",
      };
    case BookBlockType.BULLET_LIST:
      return {
        ...base,
        kind: "content",
        html: `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        atomic: false,
        splittable: "list",
        listTag: "ul",
        listItemsHtml: block.items.map((item) => `<li>${escapeHtml(item)}</li>`),
      };
    case BookBlockType.NUMBERED_LIST:
      return {
        ...base,
        kind: "content",
        html: `<ol>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`,
        atomic: false,
        splittable: "list",
        listTag: "ol",
        listItemsHtml: block.items.map((item) => `<li>${escapeHtml(item)}</li>`),
      };
    case BookBlockType.CHECKLIST: {
      const itemsHtml = block.items.map(
        (item) => `<li><span class="book-checkbox${item.checked ? " checked" : ""}"></span><span>${escapeHtml(item.text)}</span></li>`
      );
      return {
        ...base,
        kind: "content",
        html: `<ul class="book-checklist">${itemsHtml.join("")}</ul>`,
        atomic: false,
        splittable: "list",
        listTag: "ul",
        listItemsHtml: itemsHtml.map((html) => html.replace("<ul class=\"book-checklist\">", "").replace("</ul>", "")),
      };
    }
    case BookBlockType.QUOTE: {
      const attribution = block.attribution ? `<cite>— ${escapeHtml(block.attribution)}</cite>` : "";
      return {
        ...base,
        kind: "content",
        html: `<blockquote class="book-quote">${renderRichTextToHtml(block.richText)}${attribution}</blockquote>`,
        atomic: true,
        splittable: false,
      };
    }
    case BookBlockType.TIP:
    case BookBlockType.NOTE:
    case BookBlockType.WARNING: {
      const variant = block.type === BookBlockType.TIP ? "tip" : block.type === BookBlockType.NOTE ? "note" : "warning";
      const title = block.title ? `<div class="book-callout-title">${escapeHtml(block.title)}</div>` : "";
      return {
        ...base,
        kind: "content",
        html: `<div class="book-callout book-callout-${variant}">${title}${renderRichTextToHtml(block.richText)}</div>`,
        atomic: true,
        splittable: false,
      };
    }
    case BookBlockType.TABLE: {
      const headerHtml = `<thead><tr>${block.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`;
      const rowsHtml = block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`);
      return {
        ...base,
        kind: "content",
        html: `<table class="book-table">${headerHtml}<tbody>${rowsHtml.join("")}</tbody></table>`,
        atomic: false,
        splittable: "table",
        tableHeaderHtml: headerHtml,
        tableRowsHtml: rowsHtml,
      };
    }
    case BookBlockType.DIVIDER:
      return { ...base, kind: "content", html: `<hr class="book-divider" />`, atomic: true, splittable: false };
    case BookBlockType.PAGE_BREAK:
      return { ...base, kind: "pageBreakMarker", html: "", atomic: true, splittable: false };
    case BookBlockType.QR_LINK:
      return {
        ...base,
        kind: "content",
        html: `<div class="book-qr-link">${renderQrPlaceholder(block.destination)}${block.label ? `<div class="book-qr-label">${escapeHtml(block.label)}</div>` : ""}</div>`,
        atomic: true,
        splittable: false,
      };
    case BookBlockType.RECIPE_REF:
      return {
        ...base,
        kind: "content",
        html: `<div class="book-recipe-ref">${escapeHtml(block.displayTitle ?? "وصفة")}</div>`,
        atomic: true,
        splittable: false,
      };
    case BookBlockType.CITATION: {
      const reference = references.find((candidate) => candidate.id === block.referenceId);
      return {
        ...base,
        kind: "content",
        html: reference ? `<p class="book-citation-inline">[${escapeHtml(reference.label)}]</p>` : "",
        atomic: true,
        splittable: false,
      };
    }
    default:
      return { ...base, kind: "content", html: "", atomic: true, splittable: false };
  }
}

/**
 * `width`/`height` attributes are load-bearing, not decorative: the
 * paginator measures this fragment's height SYNCHRONOUSLY, before the
 * image resource has necessarily finished loading in the measurement
 * sandbox. Without explicit intrinsic dimensions, the browser lays the
 * `<img>` out at a default placeholder size until it loads, so the very
 * first measurement of an oversized image silently under-reports its
 * true height — caught live in Phase D verification (a 1000x6000px test
 * image measured as if it fit on one page, then overflowed 4.6x on
 * render). Cloudinary's `ImageAsset` already carries the real
 * width/height from upload time, so this costs nothing extra to wire in.
 */
function renderImageBlock(image: ImageAsset | null | undefined, caption: string | undefined): string {
  if (!image) return "";
  const captionHtml = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : "";
  const dimensionAttrs = image.width && image.height ? ` width="${image.width}" height="${image.height}"` : "";
  return `<figure class="book-image"><img src="${escapeHtml(image.secureUrl)}" alt="${caption ? escapeHtml(caption) : ""}"${dimensionAttrs} />${captionHtml}</figure>`;
}

/**
 * A visual QR placeholder, not a real generated code — server-side QR
 * generation is real PDF/download infrastructure (Phase F territory,
 * explicitly out of scope here). Shows the destination as text so the
 * doctor can still verify it in the preview.
 */
function renderQrPlaceholder(destination: string): string {
  return `<div class="book-qr-placeholder" style="width:28mm;height:28mm;margin:0 auto;border:0.3mm dashed #999;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#999;">QR</div><div dir="ltr" style="font-size:7pt;color:#999;word-break:break-all;">${escapeHtml(destination)}</div>`;
}
