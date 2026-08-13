import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";
import { BINDING_EDGE } from "src/common/books/book-physical-order";
import type { Book } from "src/common/interfaces/book.interface";
import { buildTemplateCss } from "./dr-omnia-book-v1/template.css";
import { resolveGeometry } from "./dr-omnia-book-v1/geometry";
import { BOOK_FONT_READINESS_PROBES, BOOK_TEMPLATE_FONT_FINGERPRINT } from "./dr-omnia-book-v1/fonts/fonts";
import { renderBlockToFragment } from "./dr-omnia-book-v1/render-block";
import {
  renderAboutDoctorPage,
  renderBackCoverPage,
  renderChapterOpenerFragment,
  renderCopyrightPage,
  renderCoverPage,
  renderReferencesPage,
  renderTitlePage,
  renderTocReservationFragment,
} from "./dr-omnia-book-v1/single-pages";
import { paginateAndRenderBook } from "./paginate-book.browser";
import type { StreamFragment } from "./page-model.interface";

const TOC_ENTRIES_PER_PAGE = 16;

/** Structural, not the full `Book` — this file (and the `BookSchema` Mongoose document callers actually hold) never needs `_id`/`createdAt`/`updatedAt`. */
export type BookContentForRender = Pick<Book, "title" | "subtitle" | "coverImage" | "backCoverImage" | "chapters" | "frontMatter" | "backMatter" | "references">;

export interface BuildBookHtmlOptions {
  book: BookContentForRender;
  identity: ResolvedBookIdentity;
  /** Restricts rendering to one chapter (staff "Preview chapter" scope) — still runs the real paginator end to end, just over a shorter stream, per BOOK_PLAN §41. */
  chapterId?: string;
}

/**
 * Assembles ONE self-contained HTML document — no external requests, no
 * build step — that embeds the template CSS (with data-URI fonts), the
 * flattened content stream, and the paginator's own compiled source
 * inlined via `.toString()`. This exact string is what the staff preview
 * route returns, and (unchanged) is what the eventual PDF renderer would
 * feed to Chromium — one builder, one paginator, per the approved
 * architecture. No PDF is generated here; Phase D stops at this HTML.
 */
export function buildBookHtml({ book, identity, chapterId }: BuildBookHtmlOptions): string {
  const geometry = resolveGeometry(identity.print.pageSize, identity.print.marginPreset, identity.print.gutterMm);
  const css = buildTemplateCss(geometry);

  const stream: StreamFragment[] = [];
  const chapters = chapterId ? book.chapters.filter((chapter) => chapter.id === chapterId) : book.chapters;
  const isFullBook = !chapterId;

  if (isFullBook) {
    stream.push(renderCoverPage(book, identity));
    stream.push(renderTitlePage(book, identity));
    stream.push(renderCopyrightPage(identity));
    const aboutDoctor = renderAboutDoctorPage(identity);
    if (aboutDoctor) stream.push(aboutDoctor);

    for (const block of book.frontMatter.aboutBook.blocks) stream.push(renderBlockToFragment(block, book.references));
    stream.push(renderTocReservationFragment());
    for (const block of book.frontMatter.introduction.blocks) stream.push(renderBlockToFragment(block, book.references));
  }

  for (const chapter of chapters) {
    stream.push(renderChapterOpenerFragment(chapter));
    for (const block of chapter.blocks) {
      const fragment = renderBlockToFragment(block, book.references);
      stream.push({ ...fragment, chapterId: chapter.id });
    }
  }

  if (isFullBook) {
    for (const block of book.backMatter.conclusion.blocks) stream.push(renderBlockToFragment(block, book.references));
    for (const fragment of renderReferencesPage(book.references)) stream.push(fragment);
    stream.push(renderBackCoverPage(book, identity));
  }

  const tocChapters = isFullBook
    ? book.chapters.filter((chapter) => chapter.includeInToc).map((chapter) => ({ chapterId: chapter.id, title: chapter.title, tocTitle: chapter.tocTitle }))
    : [];

  const paginationInputWithoutGeometry = {
    stream,
    pageNumberStart: identity.print.pageNumberStart,
    tocEligibleCount: tocChapters.length,
    tocEntriesPerPage: TOC_ENTRIES_PER_PAGE,
    tocChapters,
    fontProbes: BOOK_FONT_READINESS_PROBES,
  };

  const paginatorSource = paginateAndRenderBook.toString();

  return `<!doctype html>
<html dir="rtl" lang="ar" data-binding-edge="${BINDING_EDGE}" data-font-fingerprint="${BOOK_TEMPLATE_FONT_FINGERPRINT}">
<head>
<meta charset="utf-8" />
<style>${css}</style>
</head>
<body>
<div id="book-root"></div>
<script>
(function () {
  "use strict";
  var GEOMETRY_MM = ${JSON.stringify({ widthMm: geometry.widthMm, heightMm: geometry.heightMm, contentWidthMm: geometry.contentWidthMm, contentHeightMm: geometry.contentHeightMm })};
  var INPUT_BASE = ${JSON.stringify(paginationInputWithoutGeometry)};

  var paginateAndRenderBook = ${paginatorSource};

  function escapeHtmlInline(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /** Fills the reserved (empty) TOC pages with real entries + dotted leaders, splitting entries evenly across however many pages were reserved for them. */
  function fillTocPages(pages, toc) {
    var tocPageIndexes = [];
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].kind === "toc") tocPageIndexes.push(i);
    }
    if (tocPageIndexes.length === 0) return;
    var perPage = Math.ceil(toc.length / tocPageIndexes.length) || 1;
    for (var p = 0; p < tocPageIndexes.length; p++) {
      var entries = toc.slice(p * perPage, (p + 1) * perPage);
      var rows = entries
        .map(function (entry) {
          var pageLabel = entry.pageNumber !== null ? String(entry.pageNumber) : "";
          return (
            '<div class="book-toc-entry"><span class="book-toc-entry-title">' +
            escapeHtmlInline(entry.title) +
            '</span><span class="book-toc-entry-leader"></span><span class="book-toc-entry-page">' +
            pageLabel +
            "</span></div>"
          );
        })
        .join("");
      var heading = p === 0 ? '<div class="book-toc-title">المحتويات</div>' : "";
      pages[tocPageIndexes[p]].html = '<div class="book-toc-page">' + heading + rows + "</div>";
    }
  }

  function mmToPx(el) {
    var rect = el.getBoundingClientRect();
    return { widthPx: rect.width, heightPx: rect.height };
  }

  function sideOfPage(pageNumber) {
    return pageNumber % 2 === 0 ? "right" : "left";
  }

  function buildRunningHead(bookTitle, chapterTitle) {
    return chapterTitle || bookTitle;
  }

  async function run() {
    // Measure the REAL rendered content box in px by rendering one
    // throwaway page — never a hand-computed mm-to-px approximation —
    // so any sub-pixel rounding is the browser's own, consistent value.
    var probe = document.createElement("div");
    probe.className = "book-page";
    probe.setAttribute("data-side", "right");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.innerHTML = '<div class="book-page-content"></div>';
    document.body.appendChild(probe);
    var contentBox = probe.querySelector(".book-page-content");
    var measured = mmToPx(contentBox);
    document.body.removeChild(probe);

    var input = Object.assign({}, INPUT_BASE, {
      contentBoxWidthPx: measured.widthPx,
      contentBoxHeightPx: measured.heightPx,
    });

    var result = await paginateAndRenderBook(input);
    fillTocPages(result.pages, result.toc);

    var root = document.getElementById("book-root");
    var bookTitle = ${JSON.stringify(book.title)};
    var chapterTitleById = ${JSON.stringify(Object.fromEntries(book.chapters.map((chapter) => [chapter.id, chapter.title])))};

    var html = "";
    for (var i = 0; i < result.pages.length; i++) {
      var page = result.pages[i];
      var side = page.numbered && page.pageNumber ? sideOfPage(page.pageNumber) : (i % 2 === 0 ? "right" : "left");
      var isSpecial = ["cover", "titlePage", "copyrightPage", "backCover"].indexOf(page.kind) !== -1;
      var runningHeadHtml = "";
      var folioHtml = "";
      if (!isSpecial) {
        var chapterTitle = page.chapterId ? chapterTitleById[page.chapterId] : null;
        runningHeadHtml = '<div class="book-running-head">' + buildRunningHead(bookTitle, chapterTitle) + "</div>";
        if (page.pageNumber !== null) {
          folioHtml = '<div class="book-folio">' + page.pageNumber + "</div>";
        }
      }
      html +=
        '<div class="book-page" data-side="' +
        side +
        '" data-page-index="' +
        i +
        '" data-page-kind="' +
        page.kind +
        '"' +
        (page.pageNumber !== null ? ' data-page-number="' + page.pageNumber + '"' : "") +
        ">" +
        runningHeadHtml +
        folioHtml +
        '<div class="book-page-content">' +
        page.html +
        "</div></div>";
    }

    root.innerHTML = html;
    window.__BOOK_PAGE_MODEL__ = { pageCount: result.pageCount, toc: result.toc, warnings: result.warnings };
    document.body.setAttribute("data-pagination-complete", "true");
    document.body.setAttribute("data-page-count", String(result.pageCount));
    if (result.warnings.length > 0) {
      document.body.setAttribute("data-pagination-warnings", String(result.warnings.length));
    }
  }

  run();
})();
</script>
</body>
</html>`;
}
