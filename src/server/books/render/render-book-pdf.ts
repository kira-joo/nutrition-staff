import { getBookTemplate } from "./book-template-registry";
import type { BookContentForRender } from "./build-book-html";
import { resolveGeometry } from "./dr-omnia-book-v1/geometry";
import { launchBookRenderBrowser } from "./launch-browser";
import type { PaginationWarning } from "./page-model.interface";
import type { FrozenBookContent, RecipeSnapshot } from "src/server/books/editions/book-edition.schema";
import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";

export interface RenderedBookPdf {
  pdf: Buffer;
  pageCount: number;
  warnings: PaginationWarning[];
}

const GENERATION_TIMEOUT_MS = 60_000;

interface BookPageModel {
  pageCount: number;
  warnings: PaginationWarning[];
}

/**
 * Renders a PDF from a frozen `BookEdition`'s own `content` +
 * `resolvedSettings` — the ONLY two inputs read. Never queries the live
 * Book, BookSettings, or Recipe collections, so a PDF generated from
 * Edition 1 five years from now is byte-for-byte reproducible regardless
 * of anything that changed afterward. Uses the exact same
 * `buildBookHtml`/`paginateAndRenderBook` pipeline Staff Preview uses —
 * one renderer, one template, no separate PDF-only visual
 * implementation — the only difference is which object supplies
 * `{book, identity}`.
 */
export async function renderBookPdf(edition: {
  content: FrozenBookContent;
  resolvedSettings: ResolvedBookIdentity;
  templateVersion: string;
  recipeSnapshots?: Record<string, RecipeSnapshot>;
}): Promise<RenderedBookPdf> {
  const bookForRender: BookContentForRender = {
    title: edition.content.title,
    subtitle: edition.content.subtitle,
    coverImage: edition.content.coverImage ?? null,
    backCoverImage: edition.content.backCoverImage ?? null,
    chapters: edition.content.chapters,
    frontMatter: edition.content.frontMatter,
    backMatter: edition.content.backMatter,
    references: edition.content.references,
  };
  const identity = edition.resolvedSettings;
  const template = getBookTemplate(edition.templateVersion);
  const html = await template.buildHtml({ book: bookForRender, identity, recipeSnapshots: edition.recipeSnapshots });
  const geometry = resolveGeometry(identity.print.pageSize, identity.print.marginPreset, identity.print.gutterMm);

  const { browser, close } = await launchBookRenderBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: GENERATION_TIMEOUT_MS });
    // `run()` inside the generated document paginates asynchronously
    // (font-readiness + measurement) before it ever sets this attribute
    // — the same signal the staff preview iframe could poll for, and
    // the only reliable way to know the DOM is ready to print.
    await page.waitForFunction('document.body.getAttribute("data-pagination-complete") === "true"', { timeout: GENERATION_TIMEOUT_MS });

    // The rendered pages (including every <img>) are injected into
    // #book-root via `innerHTML` INSIDE that async run() — well after
    // `setContent`'s own "load" wait already resolved, so it covers
    // none of these images. The paginator measures images from their
    // width/height ATTRIBUTES (deliberately, so measurement never blocks
    // on the network — see render-block.ts), so pagination can complete
    // while an image's actual bytes are still downloading. Caught live:
    // every image rendered as a blank area in the exported PDF. `.pdf()`
    // rasterizes whatever has visually painted at that instant, so every
    // <img> must finish loading (or fail — `.complete` covers both) first.
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete), { timeout: GENERATION_TIMEOUT_MS });

    const pageModel = await page.evaluate(() => (window as unknown as { __BOOK_PAGE_MODEL__: BookPageModel }).__BOOK_PAGE_MODEL__);

    const pdfBytes = await page.pdf({
      width: `${geometry.widthMm}mm`,
      height: `${geometry.heightMm}mm`,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
      printBackground: true,
    });

    return { pdf: Buffer.from(pdfBytes), pageCount: pageModel.pageCount, warnings: pageModel.warnings };
  } finally {
    await close();
  }
}
