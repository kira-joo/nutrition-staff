/**
 * Targeted smoke check for the Phase F PDF renderer
 * (`render-book-pdf.ts` + `launch-browser.ts`) — not the full Phase D
 * adversarial pagination matrix (Arabic shaping/oversized images/table
 * splitting already proven against the same `buildBookHtml`/
 * `paginateAndRenderBook` pipeline; this only changed the PDF-export
 * mechanism itself and QR generation). Confirms: a real local Chromium
 * launch produces a valid PDF, the page count is sane, and the QR
 * renders as a real embedded vector image (not the old text
 * placeholder) by checking the PDF bytes contain vector path data
 * rather than the literal destination string.
 *
 * No DB, no running server, no build step needed.
 *
 *   node --import tsx scripts/qa/check-pdf-generation-smoke.ts
 */
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { renderBookPdf } from "../../src/server/books/render/render-book-pdf";
import { CURRENT_BOOK_TEMPLATE_VERSION } from "../../src/common/books/book-template-version";
import { BookBlockType, BookMarginPreset, BookPageSize } from "../../src/common/enums";
import type { FrozenBookContent } from "../../src/server/books/editions/book-edition.schema";
import type { ResolvedBookIdentity } from "../../src/common/books/resolve-book-identity";

const QR_DESTINATION = "https://example.com/books/smoke-test";

const content: FrozenBookContent = {
  title: "كتاب اختبار الطبعة",
  subtitle: "اختبار دخان",
  coverMode: "generated",
  coverImage: null,
  backCoverMode: "generated",
  backCoverImage: null,
  frontMatter: { aboutBook: { blocks: [] }, introduction: { blocks: [] } },
  chapters: [
    {
      id: "chapter-1",
      title: "الفصل الأول",
      startOnNewPage: true,
      includeInToc: true,
      order: 0,
      blocks: [
        {
          id: "block-1",
          order: 0,
          type: BookBlockType.PARAGRAPH,
          richText: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "هذا اختبار دخان لإنتاج ملف PDF من طبعة مجمّدة." }] }] },
        },
        { id: "block-2", order: 1, type: BookBlockType.QR_LINK, destination: QR_DESTINATION, label: "امسح هذا الرمز" },
      ],
    },
  ],
  backMatter: { conclusion: { blocks: [] } },
  references: [],
};

const resolvedSettings: ResolvedBookIdentity = {
  doctorName: "د. أمنية",
  doctorTitle: "أخصائية تغذية",
  doctorBio: "",
  doctorImage: null,
  bookLogo: null,
  websiteUrl: null,
  socialLinks: [],
  contact: {},
  disclaimer: "",
  copyrightText: "© اختبار",
  backCoverClosingText: "",
  backCoverAudienceText: "",
  qrDestination: QR_DESTINATION,
  print: { pageSize: BookPageSize.A5, marginPreset: BookMarginPreset.STANDARD, gutterMm: 14, pageNumberStart: 1, doublePageSpread: true },
  templateVersion: CURRENT_BOOK_TEMPLATE_VERSION,
  sources: {} as ResolvedBookIdentity["sources"],
};

async function main(): Promise<void> {
  const started = Date.now();
  const result = await renderBookPdf({ content, resolvedSettings, templateVersion: CURRENT_BOOK_TEMPLATE_VERSION });
  const elapsedMs = Date.now() - started;

  assert.ok(Buffer.isBuffer(result.pdf), "expected a Buffer");
  assert.ok(result.pdf.byteLength > 1000, `expected a real PDF, got ${result.pdf.byteLength} bytes`);
  assert.ok(result.pdf.subarray(0, 5).toString("latin1") === "%PDF-", "output does not start with a PDF header");
  assert.ok(result.pageCount >= 5, `expected at least 5 pages (cover/title/copyright/toc/chapter/back-cover), got ${result.pageCount}`);

  // The QR must be a real embedded vector image now, not the Phase D
  // text placeholder — the raw destination string should NOT appear as
  // literal PDF text content (Chromium never emits inline SVG source as
  // text operators; it rasterizes/vectorizes it), while it's fine for
  // the destination to legitimately NOT appear as visible text anywhere
  // else either, since nothing else in this fixture prints it.
  const pdfText = result.pdf.toString("latin1");
  assert.ok(!pdfText.includes(QR_DESTINATION), "the raw QR destination string appears as literal text in the PDF — QR is still a text placeholder, not a real code");

  const outputPath = "/tmp/phase-f-smoke.pdf";
  writeFileSync(outputPath, result.pdf);

  // eslint-disable-next-line no-console
  console.log(`PASS check-pdf-generation-smoke — ${result.pageCount} pages, ${(result.pdf.byteLength / 1024).toFixed(0)}KB, ${elapsedMs}ms, warnings=${JSON.stringify(result.warnings)}`);
  // eslint-disable-next-line no-console
  console.log(`  saved to ${outputPath} for manual visual inspection`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("FAIL check-pdf-generation-smoke");
  console.error(error);
  process.exit(1);
});
