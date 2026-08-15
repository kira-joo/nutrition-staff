import { BOOK_TEMPLATE_FONT_FACES, BOOK_BODY_FONT_FAMILY, BOOK_HEADING_FONT_FAMILY } from "./fonts/fonts";
import type { ResolvedGeometry } from "./geometry";

/**
 * Dr. Omnia's brand identity (matching nutrition-client, not the staff
 * UI) — a warm, clinical green, not the staff app's slate/indigo
 * palette. Kept as constants here rather than reading nutrition-client's
 * Tailwind config, since this document has no build step and must stay
 * fully self-contained.
 */
export const BRAND_COLORS = {
  primary: "#2f6f4f",
  primaryDark: "#1f4d37",
  ink: "#1c1c1c",
  muted: "#5b5b5b",
  hairline: "#d8d8d0",
  paper: "#fffdf8",
  highlight: "#fdf1d6",
  calloutTip: "#eef7ee",
  calloutNote: "#eef3fb",
  calloutWarning: "#fbeeee",
  /** The ordinary-page inner frame's accent — a warm gold-bronze, distinct from the cool green everything else uses, so the frame itself reads as a deliberate design element rather than another green rule among many. */
  frameGold: "rgba(176, 141, 79, 0.45)",
};

export interface BuildTemplateCssOptions {
  /**
   * The template's botanical/leaf artwork (a data URI here — Puppeteer's
   * `setContent` has no base URL to resolve a relative path against; see
   * `art/chapter-background.ts`). Reused across covers, the back cover,
   * and every chapter opener — one asset, one visual language, per §3 of
   * the plan. Optional so any caller that hasn't been updated still
   * produces valid (plain-color) CSS rather than a broken `url()`.
   */
  chapterBackgroundUrl?: string;
}

/**
 * One reusable template, content and styling fully separated per the
 * approved architecture — this function takes ONLY geometry (derived
 * from resolved BookSettings/Book print settings) plus the template's own
 * artwork, and never anything per-book beyond that; the visual language
 * itself never varies by Book.
 */
export function buildTemplateCss(geometry: ResolvedGeometry, options: BuildTemplateCssOptions = {}): string {
  const botanical = options.chapterBackgroundUrl ? `, url("${options.chapterBackgroundUrl}")` : "";
  const botanicalSize = options.chapterBackgroundUrl ? ", cover" : "";
  return `
${BOOK_TEMPLATE_FONT_FACES}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  background: #e5e5e0;
  font-family: "${BOOK_BODY_FONT_FAMILY}", "Noto Naskh Arabic", serif;
}

body { direction: rtl; }

.book-page {
  position: relative;
  width: ${geometry.widthMm}mm;
  height: ${geometry.heightMm}mm;
  background: ${BRAND_COLORS.paper};
  overflow: hidden;
  break-after: page;
  break-inside: avoid;
  padding-top: ${geometry.topMm}mm;
  padding-bottom: ${geometry.bottomMm}mm;
}
.book-page[data-side="left"] {
  padding-right: ${geometry.gutterMm}mm;
  padding-left: ${geometry.outerMm}mm;
}
.book-page[data-side="right"] {
  padding-left: ${geometry.gutterMm}mm;
  padding-right: ${geometry.outerMm}mm;
}

.book-page-content, .book-measure-sandbox {
  display: flow-root;
  width: ${geometry.contentWidthMm}mm;
  color: ${BRAND_COLORS.ink};
  font-size: 11pt;
  line-height: 1.9;
}
/* The real page box is fixed-height + clips anything the paginator
   miscalculates (a visible, honest failure rather than pushing content
   into the next page's box); the measurement sandbox below MUST have
   auto height, or every measurement clamps to this fixed value — the
   exact bug this comment is here to stop someone reintroducing. */
.book-page-content {
  height: ${geometry.contentHeightMm}mm;
  overflow: hidden;
}
.book-measure-sandbox {
  height: auto;
  overflow: visible;
}

/* PAGE_FOOTER_NOTE — a generic, reusable "pin to the bottom of whatever
   page this lands on" block (see paginate-book.browser.ts's
   "pageFooterNote" FragmentKind branch), reusing the title page's
   legal-footer visual language (divider above, muted smaller type). The
   paginator only ever emits the .book-page-content-body wrapper when a
   footer note actually landed on this page, so :has() keeps every other
   page a plain flow-root box, completely unaffected.
   .book-page-content-body's flex:1 absorbs all the space ABOVE the
   footer note — the same technique .book-title-page-main uses — which is
   what reserves the footer's own height automatically instead of
   position:absolute. Hand-synced with nutrition-client's identical
   rules. */
.book-page-content:has(> .book-page-content-body) {
  display: flex;
  flex-direction: column;
}
.book-page-content-body {
  flex: 1;
  min-height: 0;
  display: flow-root;
}
.book-page-footer-note {
  flex-shrink: 0;
  margin-top: 6mm;
  padding-top: 3mm;
  border-top: 0.3mm solid ${BRAND_COLORS.hairline};
  text-align: center;
}
.book-page-footer-note p { font-size: 7.5pt; line-height: 1.5; color: ${BRAND_COLORS.muted}; margin-bottom: 1mm; }
.book-page-footer-note p:last-child { margin-bottom: 0; }

/* ---- Page chrome: folio at the outer edge, running head at the inner edge ---- */
.book-running-head {
  position: absolute;
  top: 6mm;
  font-size: 8pt;
  color: ${BRAND_COLORS.muted};
  letter-spacing: 0.02em;
}
.book-page[data-side="left"] .book-running-head { right: ${geometry.gutterMm}mm; text-align: right; }
.book-page[data-side="right"] .book-running-head { left: ${geometry.gutterMm}mm; text-align: left; }

.book-folio {
  position: absolute;
  bottom: 7mm;
  font-size: 9pt;
  color: ${BRAND_COLORS.muted};
  font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif;
}
.book-page[data-side="left"] .book-folio { left: ${geometry.outerMm}mm; text-align: left; }
.book-page[data-side="right"] .book-folio { right: ${geometry.outerMm}mm; text-align: right; }

/* An ordinary printed page's inner frame — a thin decorative rule set
   IN the margin, between the trim edge and the text block, not around
   the text block itself (that would collide with real content). Only
   ordinary content pages get it; the cover, chapter openers, and the
   back cover already carry their own full-bleed artwork (generated OR
   uploaded — both still carry the same .book-cover/.book-back-cover base
   class) and would look wrong with a frame drawn over it, so the :has()
   selector excludes any page containing one of those three. This is what
   turns a plain paper fill into something that reads as a designed page
   rather than a raw HTML box. */
.book-page:not(:has(.book-cover)):not(:has(.book-chapter-opener)):not(:has(.book-back-cover))::before {
  content: "";
  position: absolute;
  inset: 4mm;
  border: 0.3mm solid ${BRAND_COLORS.frameGold};
  pointer-events: none;
}

/* ---- Typography ---- */
.book-heading, .book-subheading, h1, h2 {
  font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif;
  font-weight: 700;
  color: ${BRAND_COLORS.primaryDark};
}
.book-heading { font-size: 18pt; margin-bottom: 4mm; }
.book-subheading { font-size: 14pt; margin-bottom: 3mm; color: ${BRAND_COLORS.primary}; }
p { margin-bottom: 3mm; text-align: justify; text-justify: inter-word; }

.book-highlight { background: ${BRAND_COLORS.highlight}; padding: 0 1mm; }
.book-citation { color: ${BRAND_COLORS.primary}; font-size: 0.75em; }
a { color: ${BRAND_COLORS.primary}; text-decoration: underline; }

ul, ol { margin: 0 0 3mm 0; padding-inline-start: 6mm; }
ul.book-checklist { list-style: none; padding-inline-start: 0; }
ul.book-checklist li { display: flex; align-items: baseline; gap: 2mm; margin-bottom: 1.5mm; }
ul.book-checklist .book-checkbox { display: inline-block; width: 3.2mm; height: 3.2mm; border: 0.4mm solid ${BRAND_COLORS.primary}; border-radius: 0.6mm; flex-shrink: 0; }
ul.book-checklist .book-checkbox.checked { background: ${BRAND_COLORS.primary}; }

blockquote.book-quote {
  border-right: 1mm solid ${BRAND_COLORS.primary};
  padding-right: 4mm;
  margin: 4mm 0;
  font-style: italic;
  color: ${BRAND_COLORS.muted};
}
blockquote.book-quote cite { display: block; margin-top: 2mm; font-size: 0.85em; font-style: normal; }

.book-callout {
  border-radius: 2mm;
  padding: 3mm 4mm;
  margin: 3mm 0;
}
.book-callout-tip { background: ${BRAND_COLORS.calloutTip}; }
.book-callout-note { background: ${BRAND_COLORS.calloutNote}; }
.book-callout-warning { background: ${BRAND_COLORS.calloutWarning}; }
.book-callout-title { font-weight: 700; margin-bottom: 1.5mm; font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; }

figure.book-image {
  margin: 3mm 0;
  text-align: center;
}
/* height:auto is load-bearing, not tidiness: every img also carries real width/height attributes (see render-block.ts) so the paginator can measure it synchronously before the resource loads -- without height:auto here, the browser keeps that attribute's literal pixel height while max-width alone shrinks only the width, distorting the aspect ratio (caught live: a 1600x1000 image measured 1051px tall instead of ~279px). */
figure.book-image img { max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 1.5mm; }
figure.book-image figcaption { font-size: 9pt; color: ${BRAND_COLORS.muted}; margin-top: 1.5mm; text-align: center; }

table.book-table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 10pt; }
table.book-table th, table.book-table td { border: 0.25mm solid ${BRAND_COLORS.hairline}; padding: 1.5mm 2mm; text-align: right; }
table.book-table th { background: ${BRAND_COLORS.calloutTip}; font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; }

hr.book-divider { border: none; border-top: 0.3mm solid ${BRAND_COLORS.hairline}; margin: 5mm 0; }

.book-qr-link { text-align: center; margin: 4mm 0; }
.book-qr-link svg { width: 28mm; height: 28mm; display: block; margin: 0 auto; }
.book-qr-link .book-qr-label { font-size: 9pt; color: ${BRAND_COLORS.muted}; margin-top: 1mm; }

.book-recipe-ref { display: flex; align-items: center; gap: 3mm; border: 0.3mm solid ${BRAND_COLORS.hairline}; border-radius: 2mm; padding: 3mm; margin: 3mm 0; }
.book-recipe-ref-image { width: 20mm; height: 20mm; object-fit: cover; border-radius: 1.5mm; flex-shrink: 0; }
.book-recipe-ref-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-weight: 700; color: ${BRAND_COLORS.primaryDark}; }
.book-recipe-ref-description { font-size: 9pt; color: ${BRAND_COLORS.muted}; margin-top: 1mm; }

/* ---- Single-page compositions ---- */
/* position:absolute + inset:0 fills the WHOLE .book-page box edge to
   edge (.book-page is already position:relative) — the same technique
   .book-chapter-opener uses, and for the same reason: the previous
   negative-margin trick here only cancelled outerMm on both left AND
   right, but a real page's actual padding is gutterMm on the gutter
   side and outerMm on the outer side (see the .book-page[data-side]
   rules above) — two DIFFERENT values. Cancelling both with one
   -outerMm margin left a real, visible gap on whichever side carries
   gutterMm instead — the bug behind the cover rendering with a visible
   white margin around the artwork instead of true full-bleed. */
.book-cover, .book-back-cover {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  /* The botanical layer paints OVER the gradient (first-listed background
     layer wins); the gradient underneath is what actually shows if the
     artwork is ever omitted (chapterBackgroundUrl unset) — a real
     fallback, not decoration hidden behind decoration. */
  background-image: ${options.chapterBackgroundUrl ? `url("${options.chapterBackgroundUrl}"), ` : ""}linear-gradient(180deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark});
  background-size: cover;
  background-position: center;
  color: #fff;
}
/* "uploaded" mode (see BookCoverMode) — the doctor's own finished A5
   cover/back-cover becomes the WHOLE page, full-bleed. Deliberately no
   flex centering, no color, no text-shadow rules: nothing is ever
   rendered inside this element at all (see renderCoverPage/
   renderBackCoverPage's "uploaded" branch) — the image itself already
   contains whatever design/text it needs, so this is pure background
   positioning and nothing else. */
.book-cover.book-cover--uploaded {
  background-image: var(--book-cover-image-url);
  background-size: cover;
  background-position: center;
}
.book-back-cover.book-back-cover--uploaded {
  background-image: var(--book-back-cover-image-url);
  background-size: cover;
  background-position: center;
}
.book-cover .book-cover-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 26pt; font-weight: 700; margin-bottom: 4mm; }
.book-cover .book-cover-subtitle { font-size: 13pt; opacity: 0.9; margin-bottom: 8mm; }
.book-cover .book-cover-logo { width: 20mm; height: 20mm; border-radius: 50%; margin-top: 8mm; object-fit: cover; }
.book-cover .book-cover-doctor { font-size: 10pt; opacity: 0.85; margin-top: 4mm; }

.book-about-doctor-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  gap: 3mm;
}
/* The title page is the page immediately after the front cover, and the
   legal footer (copyright + disclaimer) is pinned to ITS bottom — not
   given its own page, not left to flow before the TOC (both tried and
   both rejected on review). A plain "height:100%; justify-content:center"
   on the whole page (like the about-doctor page rule above) would centre
   the footer INTO the middle of that centered group instead of pinning it
   to the true bottom edge, so the title/subtitle/doctor content is
   wrapped in its own flex:1 block instead: that block absorbs all the
   space ABOVE the footer and centers its own content within it, while the
   footer — a normal, non-growing flex child — is guaranteed to sit right
   after it, flush with the page's bottom inset. This also reserves the
   footer's own space automatically (its border/padding/line-height), so
   the centered content above can never overlap it. */
.book-title-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: center;
  padding-bottom: 6mm;
}
.book-title-page-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3mm;
}
.book-title-page .book-title-page-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 20pt; font-weight: 700; color: ${BRAND_COLORS.primaryDark}; }
/* Publishing/legal footer (copyright + disclaimer) — deliberately NOT a
   full-page centering treatment; a small, restrained block pinned to the
   bottom of the title page (see renderTitlePage). */
.book-legal-footer {
  flex-shrink: 0;
  margin-top: 8mm;
  padding-top: 3mm;
  border-top: 0.3mm solid ${BRAND_COLORS.hairline};
  text-align: center;
}
.book-legal-footer p { font-size: 7.5pt; line-height: 1.5; color: ${BRAND_COLORS.muted}; margin-bottom: 1mm; }
.book-legal-footer p:last-child { margin-bottom: 0; }
.book-about-doctor-page img.book-doctor-image { width: 30mm; height: 30mm; border-radius: 50%; object-fit: cover; margin: 0 auto 4mm; }
.book-about-doctor-page .book-doctor-name { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 15pt; font-weight: 700; color: ${BRAND_COLORS.primaryDark}; }
.book-about-doctor-page .book-doctor-title { font-size: 10pt; color: ${BRAND_COLORS.muted}; margin-bottom: 3mm; }

/* A full-bleed page, not a content block sharing a page with what follows
   (see build-book-html.ts / paginate-book.browser.ts — chapter openers
   are now emitted as "singlePage" fragments). position:absolute + inset:0
   fills the whole .book-page box — including its padding — because
   .book-page is already position:relative; this is simpler than
   .book-cover's negative-margin trick and doesn't depend on outerMm
   being symmetric on both sides. If a chapter has its own coverImage,
   THAT takes over the entire background instead of the template artwork
   (template-with-content-override, matching §3's "template owns the
   visual language, content fills it in"); a scrim keeps the always-white
   text legible over an arbitrary uploaded photo the same way it already
   is over the template's own dark artwork. */
.book-chapter-opener {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #fff;
  text-align: center;
  background-color: ${BRAND_COLORS.primaryDark};
  background-image: linear-gradient(180deg, rgba(20,45,35,0.15), rgba(15,35,27,0.55))${botanical};
  background-size: cover${botanicalSize};
  background-position: center${botanicalSize ? ", center" : ""};
}
.book-chapter-opener.book-chapter-opener--custom-cover {
  background-image: linear-gradient(180deg, rgba(20,45,35,0.15), rgba(15,35,27,0.55)), var(--book-chapter-cover-url);
  background-size: cover;
  background-position: center;
}
/* Percentages anchor to the CONTAINER's height, not the artwork's — since
   background-size:cover scales the (slightly wider-than-A5) artwork to
   match the container's height exactly and only crops width, these line
   up with the template art's own baked-in ornament bands (a dotted rule
   near ~23% height, a small leaf mark near ~60%) regardless of page size
   or margin preset. */
.book-chapter-opener .book-chapter-band {
  position: absolute;
  top: 27%;
  bottom: 42%;
  left: ${geometry.outerMm}mm;
  right: ${geometry.outerMm}mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3mm;
}
.book-chapter-opener .book-chapter-label {
  font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif;
  font-size: 10pt;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${BRAND_COLORS.highlight};
}
.book-chapter-opener .book-chapter-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 24pt; font-weight: 700; line-height: 1.35; }
.book-chapter-opener .book-chapter-subtitle { font-size: 12pt; opacity: 0.9; }
.book-chapter-opener .book-chapter-intro { margin-top: 1mm; font-style: italic; opacity: 0.85; max-width: 80%; }
.book-chapter-opener .book-chapter-doctor {
  position: absolute;
  top: 65%;
  left: ${geometry.outerMm}mm;
  right: ${geometry.outerMm}mm;
  font-size: 10pt;
  opacity: 0.85;
}

.book-toc-page .book-toc-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 18pt; font-weight: 700; margin-bottom: 6mm; color: ${BRAND_COLORS.primaryDark}; }
.book-toc-entry { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3mm; gap: 2mm; }
.book-toc-entry .book-toc-entry-title { white-space: nowrap; }
.book-toc-entry .book-toc-entry-leader { flex: 1; border-bottom: 0.3mm dotted ${BRAND_COLORS.hairline}; margin: 0 2mm; height: 0.6em; }
.book-toc-entry .book-toc-entry-page { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; }

.book-references-page .book-reference-entry { margin-bottom: 2.5mm; font-size: 10pt; }
.book-references-page .book-reference-entry .book-reference-label { font-weight: 700; }

.book-back-cover .book-back-cover-summary { font-size: 11pt; margin-bottom: 6mm; max-width: 90%; }
.book-back-cover .book-back-cover-audience { font-size: 10pt; opacity: 0.9; margin-bottom: 6mm; }
.book-back-cover .book-back-cover-contact { font-size: 9pt; opacity: 0.85; margin-top: auto; display: flex; flex-direction: column; gap: 1mm; }
.book-back-cover .book-back-cover-qr { margin-top: 4mm; }
.book-back-cover .book-back-cover-qr svg { width: 22mm; height: 22mm; display: block; margin: 0 auto; background: #fff; border-radius: 1mm; padding: 1mm; }
.book-back-cover .book-back-cover-logo { width: 16mm; height: 16mm; border-radius: 50%; margin-top: 4mm; object-fit: cover; }

/* Pagination-hint markers — never rendered visibly, kept only so the staff editor's PAGE_BREAK block never leaves stray content. */
.book-page-break-marker { display: none; }
`;
}
