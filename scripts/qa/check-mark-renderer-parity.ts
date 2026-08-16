/**
 * Drift guard for the DUPLICATED mark renderer.
 *
 * `paginate-book.browser.ts` keeps its own `renderMarksOpenLocal`/
 * `renderMarksCloseLocal` because `build-book-html.ts` inlines the whole
 * paginator via `.toString()`, which has no module scope to import from.
 * That duplicate is only reached when a paragraph SPLITS across a page
 * boundary — so a mark the shared renderer supports and the copy does not
 * is silently dropped on exactly those paragraphs, and nowhere else.
 *
 * That is not hypothetical: `fontSize`/`textColor` were dropped this way
 * while rendering correctly in the client Flipbook (which calls the shared
 * renderer directly), and coloured highlight lost its colour class. The
 * whole run is rebuilt from pieces, so `<strong>` went with them.
 *
 * This check fails LOUDLY the moment the two drift again. It is a static
 * comparison on purpose — it needs no browser, no DB and no build, so it
 * can run anywhere. The behavioural half (a real mid-page split through
 * the real paginator) is already covered by
 * `check-paragraph-mark-split.ts`; the two together are the guard.
 *
 *   node --import tsx scripts/qa/check-mark-renderer-parity.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FONT_SIZE_TOKENS, HIGHLIGHT_COLOR_TOKENS, TEXT_COLOR_TOKENS } from "../../src/common/books/rich-text/rich-text-tokens";

const ROOT = join(__dirname, "../..");
const shared = readFileSync(join(ROOT, "src/common/books/rich-text/render-rich-text.ts"), "utf8");
const paginator = readFileSync(join(ROOT, "src/server/books/render/paginate-book.browser.ts"), "utf8");

/** Every `case "x":` inside the given function body. */
function markCasesIn(source: string, functionName: string): Set<string> {
  const start = source.indexOf(`function ${functionName}`);
  assert.ok(start >= 0, `${functionName} not found — the renderer was renamed; update this guard.`);
  const body = source.slice(start, source.indexOf("\n  }", start));
  return new Set([...body.matchAll(/case "([a-zA-Z]+)":/g)].map((m) => m[1]));
}

const sharedOpen = markCasesIn(shared, "renderMarksOpen");
const sharedClose = markCasesIn(shared, "renderMarksClose");
const localOpen = markCasesIn(paginator, "renderMarksOpenLocal");
const localClose = markCasesIn(paginator, "renderMarksCloseLocal");

const missingOpen = [...sharedOpen].filter((m) => !localOpen.has(m));
const missingClose = [...sharedClose].filter((m) => !localClose.has(m));

assert.deepEqual(
  missingOpen,
  [],
  `paginate-book.browser.ts's renderMarksOpenLocal is missing mark(s) the shared renderer handles: ${missingOpen.join(", ")}. ` +
    `Split paragraphs would silently lose them in Staff Preview and the PDF.`
);
assert.deepEqual(
  missingClose,
  [],
  `renderMarksCloseLocal is missing mark(s): ${missingClose.join(", ")} — split paragraphs would emit unbalanced markup.`
);

// The paginator inlines the token lists for the same toString() reason, so
// those can drift independently of `rich-text-tokens.ts` too.
for (const [label, tokens] of [
  ["font size", FONT_SIZE_TOKENS],
  ["text colour", TEXT_COLOR_TOKENS],
  ["highlight colour", HIGHLIGHT_COLOR_TOKENS],
] as const) {
  const missing = tokens.filter((token) => !paginator.includes(`"${token}"`));
  assert.deepEqual(missing, [], `paginate-book.browser.ts is missing ${label} token(s): ${missing.join(", ")}`);
}

console.log(`OK  mark renderers in parity — ${[...sharedOpen].sort().join(", ")}`);
console.log(`OK  tokens inlined — ${FONT_SIZE_TOKENS.length} sizes, ${TEXT_COLOR_TOKENS.length} colours, ${HIGHLIGHT_COLOR_TOKENS.length} highlights`);
