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
};

/**
 * One reusable template, content and styling fully separated per the
 * approved architecture — this function takes ONLY geometry (derived
 * from resolved BookSettings/Book print settings) and never anything
 * per-book beyond that; the visual language itself never varies by Book.
 */
export function buildTemplateCss(geometry: ResolvedGeometry): string {
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
.book-qr-link img { width: 28mm; height: 28mm; }
.book-qr-link .book-qr-label { font-size: 9pt; color: ${BRAND_COLORS.muted}; margin-top: 1mm; }

.book-recipe-ref { border: 0.3mm solid ${BRAND_COLORS.hairline}; border-radius: 2mm; padding: 3mm; margin: 3mm 0; }

/* ---- Single-page compositions ---- */
.book-cover, .book-back-cover {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(180deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark});
  color: #fff;
  margin: -${geometry.topMm}mm -${geometry.outerMm}mm;
  padding: ${geometry.topMm}mm ${geometry.outerMm}mm;
  width: ${geometry.widthMm}mm;
  height: ${geometry.heightMm}mm;
}
.book-cover img.book-cover-image { max-width: 70%; max-height: 45%; border-radius: 2mm; margin-bottom: 8mm; object-fit: cover; }
.book-cover .book-cover-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 26pt; font-weight: 700; margin-bottom: 4mm; }
.book-cover .book-cover-subtitle { font-size: 13pt; opacity: 0.9; margin-bottom: 8mm; }
.book-cover .book-cover-logo { width: 20mm; height: 20mm; border-radius: 50%; margin-top: 8mm; object-fit: cover; }
.book-cover .book-cover-doctor { font-size: 10pt; opacity: 0.85; margin-top: 4mm; }

.book-title-page, .book-copyright-page, .book-about-doctor-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  gap: 3mm;
}
.book-title-page .book-title-page-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 20pt; font-weight: 700; color: ${BRAND_COLORS.primaryDark}; }
.book-copyright-page { font-size: 9pt; color: ${BRAND_COLORS.muted}; text-align: center; padding: 0 8mm; }
.book-about-doctor-page img.book-doctor-image { width: 30mm; height: 30mm; border-radius: 50%; object-fit: cover; margin: 0 auto 4mm; }
.book-about-doctor-page .book-doctor-name { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 15pt; font-weight: 700; color: ${BRAND_COLORS.primaryDark}; }
.book-about-doctor-page .book-doctor-title { font-size: 10pt; color: ${BRAND_COLORS.muted}; margin-bottom: 3mm; }

.book-chapter-opener { margin-bottom: 6mm; }
.book-chapter-opener img.book-chapter-cover { width: 100%; max-height: 45mm; object-fit: cover; border-radius: 2mm; margin-bottom: 4mm; }
.book-chapter-opener .book-chapter-title { font-family: "${BOOK_HEADING_FONT_FAMILY}", "Cairo", sans-serif; font-size: 22pt; font-weight: 700; color: ${BRAND_COLORS.primaryDark}; }
.book-chapter-opener .book-chapter-subtitle { font-size: 12pt; color: ${BRAND_COLORS.primary}; margin-top: 1mm; }
.book-chapter-opener .book-chapter-intro { margin-top: 4mm; font-style: italic; color: ${BRAND_COLORS.muted}; }

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
.book-back-cover .book-back-cover-logo { width: 16mm; height: 16mm; border-radius: 50%; margin-top: 4mm; object-fit: cover; }

/* Pagination-hint markers — never rendered visibly, kept only so the staff editor's PAGE_BREAK block never leaves stray content. */
.book-page-break-marker { display: none; }
`;
}
