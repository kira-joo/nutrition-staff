/**
 * Regression check for "a PARAGRAPH split across a page boundary loses
 * its inline marks" (tracked since Phase D, fixed in Phase F —
 * `richTextToParagraphRuns` + `splitRichParagraphsToFit` in
 * `paginate-book.browser.ts`). Runs the REAL paginator — inlined via
 * `.toString()` exactly like `build-book-html.ts` does in production —
 * inside a real headless Chromium page.
 *
 * Rather than hand-tuning one page height to hope the cut lands inside
 * the marked phrase (fragile — depends on exact font-metric pixel math),
 * this sweeps a range of page heights and requires that AT LEAST ONE of
 * them produces a genuine mid-phrase split: the bold phrase appearing as
 * more than one separate `<strong>` run, on two different pages, whose
 * concatenation reconstructs the original phrase exactly. That is the
 * one scenario this check exists to prove never loses marks again.
 *
 * No DB, no running server, no build step needed.
 *
 *   node --import tsx scripts/qa/check-paragraph-mark-split.ts
 */
import assert from "node:assert/strict";
import puppeteer, { type Browser } from "puppeteer";
import { renderRichTextToHtml, richTextToParagraphRuns } from "../../src/common/books/rich-text/render-rich-text";
import { paginateAndRenderBook } from "../../src/server/books/render/paginate-book.browser";
import type { PaginationInput, PaginationResult, StreamFragment } from "../../src/server/books/render/page-model.interface";
import type { RichTextDoc } from "../../src/common/books/rich-text/rich-text-doc.interface";

const LEAD_IN = Array.from({ length: 40 }, (_, index) => `lead${index}`).join(" ");
const MARKED_PHRASE = Array.from({ length: 30 }, (_, index) => `marked${index}`).join(" ");
const TRAILING = Array.from({ length: 40 }, (_, index) => `tail${index}`).join(" ");
const HEIGHTS_TO_TRY = [40, 60, 80, 100, 120, 150, 180, 220, 260, 300, 350, 400];

const doc: RichTextDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: `${LEAD_IN} ` },
        { type: "text", text: MARKED_PHRASE, marks: [{ type: "bold" }] },
        { type: "text", text: ` ${TRAILING}` },
      ],
    },
  ],
};

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildInput(contentBoxHeightPx: number): PaginationInput {
  const fragment: StreamFragment = {
    id: "regression-paragraph",
    kind: "content",
    html: renderRichTextToHtml(doc),
    chapterId: null,
    atomic: false,
    keepWithNext: false,
    forceNewPage: false,
    splittable: "paragraph",
    richTextParagraphs: richTextToParagraphRuns(doc),
  };
  // A tiny preceding atomic fragment gives the page nonzero `usedHeight`
  // before the long paragraph is reached — matching the realistic case
  // (a paragraph following a heading/divider), and sidestepping the
  // separate, pre-existing "a splittable fragment landing at usedHeight
  // === 0 overflows instead of splitting" behavior, which this check is
  // not about.
  const spacer: StreamFragment = {
    id: "regression-spacer",
    kind: "content",
    html: "<hr />",
    chapterId: null,
    atomic: true,
    keepWithNext: false,
    forceNewPage: false,
    splittable: false,
  };
  return {
    stream: [spacer, fragment],
    contentBoxWidthPx: 320,
    contentBoxHeightPx,
    pageNumberStart: 1,
    tocEligibleCount: 0,
    tocEntriesPerPage: 16,
    tocChapters: [],
    fontProbes: [],
  };
}

// Inlines the REAL paginator source into the page's own <script> tag —
// exactly the technique `build-book-html.ts` uses in production — so
// this check exercises the actual shipped code, not a reimplementation.
// `tsx`'s esbuild-based transpilation (this script's own run environment
// only — Next's SWC/webpack build doesn't do this) injects calls to a
// `__name` helper into `.toString()` output; a no-op stub is enough
// since nothing here reads a function's `.name`.
function buildHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8" />
<style>body{margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;}</style>
</head><body>
<script>
function __name(fn) { return fn; }
window.__paginate__ = ${paginateAndRenderBook.toString()};
</script>
</body></html>`;
}

async function paginateAtHeight(browser: Browser, contentBoxHeightPx: number): Promise<PaginationResult> {
  const page = await browser.newPage();
  try {
    await page.setContent(buildHtml(), { waitUntil: "load" });
    return await page.evaluate(
      (paginationInput) => (window as unknown as { __paginate__: typeof paginateAndRenderBook }).__paginate__(paginationInput),
      buildInput(contentBoxHeightPx)
    );
  } finally {
    await page.close();
  }
}

/** No text lost/duplicated across the split, for every height tried — the baseline correctness invariant regardless of whether this particular height happens to split inside the marked phrase. */
function assertLosslessReconstruction(result: PaginationResult, contentBoxHeightPx: number): void {
  const allHtml = result.pages.map((renderedPage) => renderedPage.html).join("");
  const reconstituted = normalize(allHtml.replace(/<[^>]+>/g, ""));
  const source = normalize(`${LEAD_IN} ${MARKED_PHRASE} ${TRAILING}`);
  assert.strictEqual(reconstituted, source, `[height=${contentBoxHeightPx}] reconstructed text across all pages must exactly match the source (no loss/duplication)`);
}

/** Returns the bold runs found, in page order, each tagged with which page index it's on — or null if the marked phrase wasn't actually split across two different pages at this height. */
function findMidPhraseSplit(result: PaginationResult): { boldRuns: string[] } | null {
  const boldRunsByPage = result.pages.map((renderedPage) => [...renderedPage.html.matchAll(/<strong>([^<]*)<\/strong>/g)].map((match) => match[1]));
  const pagesWithBold = boldRunsByPage.filter((runs) => runs.length > 0);
  if (pagesWithBold.length < 2) return null;

  const boldRuns = boldRunsByPage.flat();
  const concatenated = normalize(boldRuns.join(""));
  if (concatenated !== normalize(MARKED_PHRASE)) return null;

  // Every non-bold page/run must be free of the marked text, and every
  // bold run must be free of the plain lead-in/trailing text — marks
  // must land on exactly the right characters, not merely "somewhere."
  const nonBoldText = normalize(
    result.pages
      .map((renderedPage) => renderedPage.html.replace(/<strong>[^<]*<\/strong>/g, ""))
      .join(" ")
      .replace(/<[^>]+>/g, "")
  );
  if (nonBoldText.includes("marked")) return null;
  if (concatenated.includes("lead") || concatenated.includes("tail")) return null;

  return { boldRuns };
}

async function main(): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });
  try {
    let found: { contentBoxHeightPx: number; boldRuns: string[]; pageCount: number } | null = null;

    for (const contentBoxHeightPx of HEIGHTS_TO_TRY) {
      const result = await paginateAtHeight(browser, contentBoxHeightPx);
      assertLosslessReconstruction(result, contentBoxHeightPx);

      if (!found) {
        const split = findMidPhraseSplit(result);
        if (split) found = { contentBoxHeightPx, boldRuns: split.boldRuns, pageCount: result.pageCount };
      }
    }

    assert.ok(
      found,
      `never observed the marked phrase split across two pages while sweeping content-box heights [${HEIGHTS_TO_TRY.join(", ")}]px — this check cannot confirm marks survive a real page-boundary split`
    );

    assert.ok(found.boldRuns.length >= 2, "expected at least two separate <strong> runs (one per page) for a genuine mid-phrase split");

    // eslint-disable-next-line no-console
    console.log(
      `PASS check-paragraph-mark-split — at height=${found.contentBoxHeightPx}px (${found.pageCount} pages), the marked phrase split into ${found.boldRuns.length} <strong> runs across pages and reassembled exactly: ${found.boldRuns.map((run) => `"${run}"`).join(" + ")}`
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("FAIL check-paragraph-mark-split");
  console.error(error);
  process.exit(1);
});
