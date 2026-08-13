/**
 * Runs ONLY inside the generated book document's own `<script>` tag —
 * never imported and called directly from Node. `build-book-html.ts`
 * takes `paginateAndRenderBook.toString()` (already-compiled JS by the
 * time this module is imported inside a Next.js route handler) and
 * inlines it verbatim into the page. That is why this file:
 *
 *   - has no value-level imports (type-only imports compile away to
 *     nothing, so they're safe — anything else would be `undefined` in
 *     the inlined copy);
 *   - keeps every helper as a nested function INSIDE the one exported
 *     function, so `.toString()` captures the whole call graph, not
 *     just the outer shell;
 *   - uses only DOM/browser globals (`document`, `Range`, etc.) — this
 *     code's only execution environment is the generated document's own
 *     browser context (real Chromium for print-preview today; the same
 *     bundled Chromium for PDF generation once Phase F exists).
 *
 * This is the SAME paginator for staff preview and (later) the PDF
 * render — one builder, one algorithm, no possible divergence.
 */

import type { PaginationInput, PaginationResult, StreamFragmentParagraph, StreamFragmentRun } from "./page-model.interface";

export async function paginateAndRenderBook(input: PaginationInput): Promise<PaginationResult> {
  const warnings: { code: string; message: string }[] = [];

  // ---- 1. Font readiness (explicit Arabic sample, never trust the family name alone) ----
  async function ensureFontsReady(): Promise<void> {
    const probes = input.fontProbes;
    await Promise.all(probes.map((probe) => document.fonts.load(`${probe.weight} 16px "${probe.family}"`, probe.sampleText)));
    await document.fonts.ready;
  }

  // ---- 2. Measurement sandbox: `display: flow-root` isolates the candidate's own
  // margins/floats from bleeding into the measurement (the "flow-root fix") ----
  const sandbox = document.createElement("div");
  sandbox.style.position = "absolute";
  sandbox.style.visibility = "hidden";
  sandbox.style.top = "-99999px";
  sandbox.style.left = "0";
  sandbox.style.display = "flow-root";
  sandbox.style.width = `${input.contentBoxWidthPx}px`;
  sandbox.className = "book-measure-sandbox";
  document.body.appendChild(sandbox);

  function measureHtmlHeight(html: string): number {
    sandbox.innerHTML = html;
    const height = sandbox.getBoundingClientRect().height;
    sandbox.innerHTML = "";
    return height;
  }

  // ---- 3. Word/line-boundary-correct, MARK-PRESERVING paragraph splitting ----
  // Same binary-search-to-a-line-boundary algorithm as before, but
  // operating on `richTextParagraphs` (runs of {text, marks}) instead of
  // flattened plain text, so a continuation fragment keeps its bold/
  // italic/highlight/link/citation marks and its original multi-paragraph
  // structure (a PARAGRAPH block's rich text doc can hold more than one
  // top-level "paragraph" node — pressing Enter inside the editor — which
  // the old plain-text version silently collapsed into one <p>).
  interface FlatPiece {
    text: string;
    marks: StreamFragmentRun["marks"];
    paragraphIndex: number;
  }

  function escapeHtmlLocal(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  const SAFE_HREF_PATTERN_LOCAL = /^(https?:\/\/|\/)/;

  // Mirrors `render-rich-text.ts`'s mark→tag mapping exactly. Duplicated
  // rather than imported: this whole file is inlined via
  // `Function.prototype.toString()` into the generated document's own
  // <script> tag and must stay import-free at the value level (see the
  // file header). Keep both in sync by hand if a mark type is ever added.
  function renderMarksOpenLocal(marks: FlatPiece["marks"]): string {
    return marks
      .map((mark) => {
        switch (mark.type) {
          case "bold":
            return "<strong>";
          case "italic":
            return "<em>";
          case "highlight":
            return '<mark class="book-highlight">';
          case "link": {
            const href = mark.attrs?.href && SAFE_HREF_PATTERN_LOCAL.test(mark.attrs.href) ? mark.attrs.href : "";
            return href ? `<a href="${escapeHtmlLocal(href)}">` : "<span>";
          }
          case "citation":
            return '<sup class="book-citation">';
          default:
            return "";
        }
      })
      .join("");
  }

  function renderMarksCloseLocal(marks: FlatPiece["marks"]): string {
    return marks
      .slice()
      .reverse()
      .map((mark) => {
        switch (mark.type) {
          case "bold":
            return "</strong>";
          case "italic":
            return "</em>";
          case "highlight":
            return "</mark>";
          case "link":
            return mark.attrs?.href && SAFE_HREF_PATTERN_LOCAL.test(mark.attrs.href) ? "</a>" : "</span>";
          case "citation":
            return "</sup>";
          default:
            return "";
        }
      })
      .join("");
  }

  function marksEqual(a: FlatPiece["marks"], b: FlatPiece["marks"]): boolean {
    if (a.length !== b.length) return false;
    return a.every((mark, index) => mark.type === b[index].type && JSON.stringify(mark.attrs ?? null) === JSON.stringify(b[index].attrs ?? null));
  }

  function flattenParagraphsToPieces(paragraphs: StreamFragmentParagraph[]): FlatPiece[] {
    const pieces: FlatPiece[] = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      paragraph.runs.forEach((run) => {
        run.text
          .split(/(\s+)/)
          .filter((part) => part.length > 0)
          .forEach((part) => pieces.push({ text: part, marks: run.marks, paragraphIndex }));
      });
    });
    return pieces;
  }

  /** Groups consecutive pieces sharing the same `paragraphIndex` — does NOT reintroduce an interior paragraph that contributed zero pieces (a fully empty `<p></p>`); an acceptable, pre-existing-severity edge case, not what this fix targets. */
  function groupByParagraphIndex(pieces: FlatPiece[]): FlatPiece[][] {
    const groups: FlatPiece[][] = [];
    let current: FlatPiece[] = [];
    let currentIndex: number | null = null;
    pieces.forEach((piece) => {
      if (piece.paragraphIndex !== currentIndex) {
        if (current.length > 0) groups.push(current);
        current = [];
        currentIndex = piece.paragraphIndex;
      }
      current.push(piece);
    });
    if (current.length > 0) groups.push(current);
    return groups;
  }

  /** Renders a run of pieces, merging adjacent pieces with identical marks into one tag pair — tidier output only, never affects layout/measurement. */
  function renderPiecesAsRuns(pieces: FlatPiece[]): string {
    let html = "";
    let index = 0;
    while (index < pieces.length) {
      let text = pieces[index].text;
      const marks = pieces[index].marks;
      let next = index + 1;
      while (next < pieces.length && marksEqual(pieces[next].marks, marks)) {
        text += pieces[next].text;
        next += 1;
      }
      html += renderMarksOpenLocal(marks) + escapeHtmlLocal(text) + renderMarksCloseLocal(marks);
      index = next;
    }
    return html;
  }

  function renderParagraphPrefixHtml(pieces: FlatPiece[], cutIndex: number): string {
    return groupByParagraphIndex(pieces.slice(0, cutIndex))
      .map((group) => `<p>${renderPiecesAsRuns(group)}</p>`)
      .join("");
  }

  function mergeAdjacentMarksToRuns(pieces: FlatPiece[]): StreamFragmentRun[] {
    const runs: StreamFragmentRun[] = [];
    pieces.forEach((piece) => {
      const last = runs[runs.length - 1];
      if (last && marksEqual(last.marks, piece.marks)) {
        last.text += piece.text;
      } else {
        runs.push({ text: piece.text, marks: piece.marks });
      }
    });
    return runs;
  }

  function piecesToParagraphs(pieces: FlatPiece[]): StreamFragmentParagraph[] {
    return groupByParagraphIndex(pieces).map((group) => ({ runs: mergeAdjacentMarksToRuns(group) }));
  }

  /** Full (uncut) render of paragraphs straight from runs — no piece-level tokenizing needed since nothing is being measured/cut here. Used for a continuation fragment's `html` field. */
  function renderParagraphsHtml(paragraphs: StreamFragmentParagraph[]): string {
    return paragraphs
      .map((paragraph) => `<p>${paragraph.runs.map((run) => renderMarksOpenLocal(run.marks) + escapeHtmlLocal(run.text) + renderMarksCloseLocal(run.marks)).join("")}</p>`)
      .join("");
  }

  function splitRichParagraphsToFit(paragraphs: StreamFragmentParagraph[], remainingHeightPx: number): { fitHtml: string; remainderParagraphs: StreamFragmentParagraph[] } | null {
    const pieces = flattenParagraphsToPieces(paragraphs);
    if (pieces.length <= 1) return null;

    let low = 0;
    let high = pieces.length;
    let bestCount = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const height = measureHtmlHeight(renderParagraphPrefixHtml(pieces, mid));
      if (height <= remainingHeightPx) {
        bestCount = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    if (bestCount === 0) return null;

    // A cut landing exactly ON a paragraph boundary (not inside one) is
    // always fine — same as a break between any two blocks — so the
    // line-boundary snap and widow policy below only apply when the cut
    // falls strictly inside one paragraph.
    const splitsMidParagraph = bestCount < pieces.length && pieces[bestCount - 1].paragraphIndex === pieces[bestCount].paragraphIndex;

    if (splitsMidParagraph) {
      // Snap backwards to a real rendered line boundary via
      // Range.getClientRects() over the WHOLE last <p> (not just its
      // first child — marks mean the paragraph can have several child
      // nodes now) — a raw piece-count cut can still land mid-line.
      sandbox.innerHTML = renderParagraphPrefixHtml(pieces, bestCount);
      const paragraphEls = sandbox.querySelectorAll("p");
      const lastParagraphEl = paragraphEls[paragraphEls.length - 1] as HTMLElement | undefined;
      let lineCount = 1;
      if (lastParagraphEl) {
        const range = document.createRange();
        range.selectNodeContents(lastParagraphEl);
        lineCount = new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))).size || 1;
      }
      sandbox.innerHTML = "";

      // Orphan policy: fewer than 2 lines placed of a paragraph that
      // continues retracts the whole thing to the next page instead.
      if (lineCount < 2) return null;

      // Widow policy: fewer than ~3 words left as a remainder WITHIN THE
      // SAME paragraph reads as a bad widow — pull a little more back
      // rather than leave a tiny orphan line. A full next paragraph
      // sitting in the remainder is never a "widow" of this one.
      const splitParagraphIndex = pieces[bestCount - 1].paragraphIndex;
      let scanIndex = bestCount;
      let remainderWordCount = 0;
      while (scanIndex < pieces.length && pieces[scanIndex].paragraphIndex === splitParagraphIndex) {
        if (pieces[scanIndex].text.trim().length > 0) remainderWordCount += 1;
        scanIndex += 1;
      }
      if (remainderWordCount > 0 && remainderWordCount < 3 && bestCount > 3) {
        bestCount = Math.max(0, bestCount - 6);
        if (bestCount === 0) return null;
      }
    }

    const remainderPieces = pieces.slice(bestCount);
    if (remainderPieces.length === 0) return null;

    return { fitHtml: renderParagraphPrefixHtml(pieces, bestCount), remainderParagraphs: piecesToParagraphs(remainderPieces) };
  }

  // ---- 4. Table splitting with repeated headers ----
  function splitTableToFit(headerHtml: string, rowsHtml: string[], remainingHeightPx: number): { fitRows: string[]; remainderRows: string[] } | null {
    const headerHeight = measureHtmlHeight(`<table class="book-table">${headerHtml}<tbody></tbody></table>`);
    let fitCount = 0;
    for (let count = 1; count <= rowsHtml.length; count++) {
      const candidate = `<table class="book-table">${headerHtml}<tbody>${rowsHtml.slice(0, count).join("")}</tbody></table>`;
      const height = measureHtmlHeight(candidate);
      if (height <= remainingHeightPx) fitCount = count;
      else break;
    }
    if (fitCount === 0 || headerHeight > remainingHeightPx) return null;
    // Never leave a single orphan row alone on a page by itself when more rows exist.
    if (fitCount === 1 && rowsHtml.length > 1) return null;
    return { fitRows: rowsHtml.slice(0, fitCount), remainderRows: rowsHtml.slice(fitCount) };
  }

  // ---- 5. The forward pagination pass ----
  interface WorkItem {
    fragment: PaginationInput["stream"][number];
    htmlOverride?: string;
    isContinuation?: boolean;
  }

  function layoutPass(tocPageCount: number): { pages: { kind: string; chapterId: string | null; html: string; numbered: boolean }[]; chapterPageIndex: Map<string, number> } {
    const pages: { kind: string; chapterId: string | null; html: string; numbered: boolean }[] = [];
    const chapterPageIndex = new Map<string, number>();
    let currentPageHtml = "";
    let usedHeight = 0;
    let currentKind = "content";
    let currentChapterId: string | null = null;

    function openPage(kind: string, chapterId: string | null): void {
      currentPageHtml = "";
      usedHeight = 0;
      currentKind = kind;
      currentChapterId = chapterId;
    }
    function closePage(numbered: boolean): void {
      pages.push({ kind: currentKind, chapterId: currentChapterId, html: currentPageHtml, numbered });
    }

    openPage("content", null);
    // Runs once per TOC-fixpoint pass — only the FINAL pass's warnings are
    // meaningful (they describe the layout actually shipped), so each pass
    // starts clean rather than accumulating duplicates across passes.
    warnings.length = 0;

    const queue: WorkItem[] = input.stream.map((fragment) => ({ fragment }));
    let guard = 0;
    while (queue.length > 0) {
      guard += 1;
      if (guard > 20000) {
        warnings.push({ code: "PAGINATION_GUARD", message: "Pagination safety guard triggered — stopping to avoid an infinite loop." });
        break;
      }
      const item = queue.shift()!;
      const fragment = item.fragment;
      const html = item.htmlOverride ?? fragment.html;

      if (fragment.kind === "pageBreakMarker") {
        if (currentPageHtml !== "") {
          closePage(true);
          openPage("content", currentChapterId);
        }
        continue;
      }

      const forceNewPage = fragment.forceNewPage && currentPageHtml !== "" && !item.isContinuation;
      if (forceNewPage) {
        closePage(true);
        openPage(fragment.kind === "chapterOpener" ? "chapterOpener" : "content", fragment.chapterId ?? currentChapterId);
      }

      if (fragment.kind === "singlePage") {
        if (currentPageHtml !== "") closePage(fragment.numbered !== false);
        openPage(fragment.pageKind ?? "content", fragment.chapterId ?? null);
        currentPageHtml = html;
        closePage(fragment.numbered !== false);
        openPage("content", currentChapterId);
        continue;
      }

      if (fragment.kind === "tocReservation") {
        for (let i = 0; i < tocPageCount; i++) {
          if (currentPageHtml !== "") closePage(true);
          openPage("toc", null);
          currentPageHtml = "";
          closePage(true);
          openPage("content", currentChapterId);
        }
        continue;
      }

      if (fragment.chapterId && fragment.kind === "chapterOpener") {
        chapterPageIndex.set(fragment.chapterId, pages.length);
      }

      const remaining = input.contentBoxHeightPx - usedHeight;
      const height = measureHtmlHeight(html);

      if (height <= remaining) {
        // keepWithNext: if placing this fragment leaves no room for the
        // very next fragment (and that next fragment can't itself be
        // split), retract this one to the next page together with it —
        // this is what stops a heading from orphaning alone at a page
        // bottom.
        const next = queue[0]?.fragment;
        if (fragment.keepWithNext && next && !next.splittable) {
          const nextHtml = next.html;
          const nextHeight = measureHtmlHeight(nextHtml);
          if (height + nextHeight > remaining && usedHeight > 0) {
            closePage(true);
            openPage("content", currentChapterId);
            currentPageHtml += html;
            usedHeight = measureHtmlHeight(currentPageHtml);
            if (fragment.chapterId) currentChapterId = fragment.chapterId;
            continue;
          }
        }
        currentPageHtml += html;
        usedHeight = measureHtmlHeight(currentPageHtml);
        if (fragment.chapterId) currentChapterId = fragment.chapterId;
        continue;
      }

      // Doesn't fit as-is.
      if (fragment.atomic) {
        if (usedHeight > 0) {
          closePage(true);
          openPage("content", currentChapterId);
          queue.unshift(item);
          continue;
        }
        // Doesn't fit even on a fresh empty page.
        if (fragment.degrade === "scaleImage") {
          const scaled = scaleImageFragmentToFit(html, input.contentBoxHeightPx);
          currentPageHtml += scaled;
          usedHeight = measureHtmlHeight(currentPageHtml);
          warnings.push({ code: "IMAGE_SCALED_DOWN", message: `An oversized image/caption was scaled down to fit the page (fragment ${fragment.id}).` });
          continue;
        }
        warnings.push({ code: "ATOMIC_OVERFLOW", message: `Fragment ${fragment.id} does not fit on an empty page and could not be split or scaled — it will overflow visually.` });
        currentPageHtml += html;
        usedHeight = measureHtmlHeight(currentPageHtml);
        continue;
      }

      if (fragment.splittable === "paragraph") {
        if (usedHeight === 0) {
          // Doesn't even fit alone on an empty page — let it overflow rather than loop forever.
          warnings.push({ code: "PARAGRAPH_OVERFLOW", message: `Fragment ${fragment.id} could not be split to fit an empty page.` });
          currentPageHtml += html;
          usedHeight = measureHtmlHeight(currentPageHtml);
          continue;
        }
        const split = splitRichParagraphsToFit(fragment.richTextParagraphs ?? [], remaining);
        if (!split) {
          closePage(true);
          openPage("content", currentChapterId);
          queue.unshift(item);
          continue;
        }
        currentPageHtml += split.fitHtml;
        usedHeight = measureHtmlHeight(currentPageHtml);
        queue.unshift({
          fragment: { ...fragment, html: renderParagraphsHtml(split.remainderParagraphs), richTextParagraphs: split.remainderParagraphs },
          isContinuation: true,
        });
        continue;
      }

      if (fragment.splittable === "table" && fragment.tableHeaderHtml && fragment.tableRowsHtml) {
        if (usedHeight === 0 && measureHtmlHeight(`<table class="book-table">${fragment.tableHeaderHtml}<tbody>${fragment.tableRowsHtml[0] ?? ""}</tbody></table>`) > input.contentBoxHeightPx) {
          warnings.push({ code: "TABLE_ROW_OVERFLOW", message: `A single row of table ${fragment.id} is taller than one page.` });
          currentPageHtml += html;
          usedHeight = measureHtmlHeight(currentPageHtml);
          continue;
        }
        const split = splitTableToFit(fragment.tableHeaderHtml, fragment.tableRowsHtml, remaining);
        if (!split) {
          closePage(true);
          openPage("content", currentChapterId);
          queue.unshift(item);
          continue;
        }
        currentPageHtml += `<table class="book-table">${fragment.tableHeaderHtml}<tbody>${split.fitRows.join("")}</tbody></table>`;
        usedHeight = measureHtmlHeight(currentPageHtml);
        if (split.remainderRows.length > 0) {
          queue.unshift({
            fragment: { ...fragment, tableRowsHtml: split.remainderRows, html: `<table class="book-table">${fragment.tableHeaderHtml}<tbody>${split.remainderRows.join("")}</tbody></table>` },
            isContinuation: true,
          });
        }
        continue;
      }

      if (fragment.splittable === "list" && fragment.listItemsHtml) {
        const items = fragment.listItemsHtml;
        let fitCount = 0;
        for (let count = 1; count <= items.length; count++) {
          const candidate = wrapListItems(fragment.listTag ?? "ul", items.slice(0, count));
          if (measureHtmlHeight(candidate) <= remaining) fitCount = count;
          else break;
        }
        if (fitCount === 0) {
          closePage(true);
          openPage("content", currentChapterId);
          queue.unshift(item);
          continue;
        }
        currentPageHtml += wrapListItems(fragment.listTag ?? "ul", items.slice(0, fitCount));
        usedHeight = measureHtmlHeight(currentPageHtml);
        if (fitCount < items.length) {
          queue.unshift({
            fragment: { ...fragment, listItemsHtml: items.slice(fitCount), html: wrapListItems(fragment.listTag ?? "ul", items.slice(fitCount)) },
            isContinuation: true,
          });
        }
        continue;
      }

      // Unknown/unsplittable and doesn't fit — retract to a new page once, else overflow.
      if (usedHeight > 0) {
        closePage(true);
        openPage("content", currentChapterId);
        queue.unshift(item);
        continue;
      }
      warnings.push({ code: "UNSPLITTABLE_OVERFLOW", message: `Fragment ${fragment.id} does not fit and has no split/degrade strategy.` });
      currentPageHtml += html;
      usedHeight = measureHtmlHeight(currentPageHtml);
    }

    if (currentPageHtml !== "" || pages.length === 0) closePage(true);
    return { pages, chapterPageIndex };
  }

  function wrapListItems(tag: string, items: string[]): string {
    return `<${tag}>${items.join("")}</${tag}>`;
  }

  /**
   * Computes the scaled-down box itself (from the `width`/`height`
   * ATTRIBUTES `render-block.ts` already embeds) rather than setting
   * `height: auto` and trusting the browser to resolve it against the
   * `max-height` constraint before the image resource has loaded in the
   * measurement sandbox — caught live: with both dimensions `auto` under
   * a `max-height`, Chromium does NOT reliably reuse the width/height
   * attributes' aspect-ratio hint the way it does for a plain `height:
   * auto` with no competing `max-height`, so the very first measurement
   * synchronously saw the image at ~0 height. Explicit numeric
   * width/height removes any dependency on load timing entirely.
   *
   * Then, exactly like the paragraph/table splitters, measures the WHOLE
   * fragment (image + whatever caption/markup surrounds it) and
   * iterates — the caption's own height is real height the image's
   * budget must leave room for.
   */
  function scaleImageFragmentToFit(html: string, pageHeightPx: number): string {
    const match = html.match(/width="(\d+)" height="(\d+)"/);
    const naturalWidth = match ? Number(match[1]) : 1;
    const naturalHeight = match ? Number(match[2]) : 1;
    const aspectRatio = naturalWidth / naturalHeight;

    let targetImageHeight = pageHeightPx;
    for (let attempt = 0; attempt < 4; attempt++) {
      const targetImageWidth = targetImageHeight * aspectRatio;
      const candidate = html.replace(
        /<img /,
        `<img style="height:${Math.floor(targetImageHeight)}px;width:${Math.floor(targetImageWidth)}px;max-width:100%;" `
      );
      const totalHeight = measureHtmlHeight(candidate);
      const overflow = totalHeight - pageHeightPx;
      if (overflow <= 0.5) return candidate;
      targetImageHeight = Math.max(1, targetImageHeight - overflow - 1);
    }
    const finalWidth = targetImageHeight * aspectRatio;
    return html.replace(/<img /, `<img style="height:${Math.floor(targetImageHeight)}px;width:${Math.floor(finalWidth)}px;max-width:100%;" `);
  }

  // ---- 6. TOC fixpoint (bounded at 3 passes) ----
  await ensureFontsReady();

  let tocPageCount = input.tocEligibleCount > 0 ? Math.max(1, Math.ceil(input.tocEligibleCount / input.tocEntriesPerPage)) : 0;
  let lastResult = layoutPass(tocPageCount);
  for (let pass = 0; pass < 2; pass++) {
    const nextTocPageCount = input.tocEligibleCount > 0 ? Math.max(1, Math.ceil(input.tocEligibleCount / input.tocEntriesPerPage)) : 0;
    if (nextTocPageCount === tocPageCount) break;
    tocPageCount = nextTocPageCount;
    lastResult = layoutPass(tocPageCount);
  }

  document.body.removeChild(sandbox);

  // ---- 7. Assign final page numbers + TOC entries ----
  const pages = lastResult.pages;
  let folio = input.pageNumberStart;
  const numberedPages = pages.map((page) => {
    if (!page.numbered) return { ...page, pageNumber: null as number | null };
    const pageNumber = folio;
    folio += 1;
    return { ...page, pageNumber };
  });

  const toc = input.tocChapters.map((chapter) => {
    const pageIndex = lastResult.chapterPageIndex.get(chapter.chapterId);
    const pageNumber = pageIndex !== undefined ? numberedPages[pageIndex]?.pageNumber ?? null : null;
    return { chapterId: chapter.chapterId, title: chapter.tocTitle || chapter.title, pageNumber };
  });

  return {
    pageCount: numberedPages.length,
    pages: numberedPages,
    toc,
    warnings,
  };
}
