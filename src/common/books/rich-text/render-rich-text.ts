import type { RichTextDoc, RichTextMark, RichTextNode } from "./rich-text-doc.interface";

/**
 * The one shared JSON→HTML renderer for Book rich text — used by the staff
 * preview and (later) the print template and the flipbook, so all three
 * agree on markup by construction rather than by convention. Escapes text
 * content on output; only `href`s already restricted to safe protocols by
 * `assert-valid-rich-text-doc.ts` are ever emitted as an attribute.
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const SAFE_HREF_PATTERN = /^(https?:\/\/|\/)/;

function renderMarksOpen(marks: RichTextMark[]): string {
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
          const href = mark.attrs?.href && SAFE_HREF_PATTERN.test(mark.attrs.href) ? mark.attrs.href : "";
          return href ? `<a href="${escapeHtml(href)}">` : "<span>";
        }
        case "citation":
          return '<sup class="book-citation">';
        default:
          return "";
      }
    })
    .join("");
}

function renderMarksClose(marks: RichTextMark[]): string {
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
          return mark.attrs?.href && SAFE_HREF_PATTERN.test(mark.attrs.href) ? "</a>" : "</span>";
        case "citation":
          return "</sup>";
        default:
          return "";
      }
    })
    .join("");
}

function renderNode(node: RichTextNode): string {
  if (node.type === "text") {
    const text = escapeHtml(node.text ?? "");
    const marks = node.marks ?? [];
    return `${renderMarksOpen(marks)}${text}${renderMarksClose(marks)}`;
  }
  const inner = (node.content ?? []).map(renderNode).join("");
  return `<p>${inner}</p>`;
}

export function renderRichTextToHtml(doc: RichTextDoc | null | undefined): string {
  if (!doc || !Array.isArray(doc.content)) return "";
  return doc.content.map(renderNode).join("");
}

/** Flattens a doc to its plain-text content, e.g. for search indexing or a text-only preview. */
export function richTextToPlainText(doc: RichTextDoc | null | undefined): string {
  if (!doc || !Array.isArray(doc.content)) return "";
  function collect(node: RichTextNode): string {
    if (node.type === "text") return node.text ?? "";
    return (node.content ?? []).map(collect).join("");
  }
  return doc.content.map(collect).join("\n");
}

/**
 * Projects a doc into `{runs: {text, marks}[]}[]` — one entry per
 * top-level "paragraph" node, each holding its "text" nodes verbatim
 * (text + marks, no rendering). This is the mark-preserving counterpart
 * to `richTextToPlainText`: the paginator (`paginate-book.browser.ts`)
 * splits from this shape instead of flattened plain text specifically so
 * a paragraph continuation that crosses a page boundary keeps its bold/
 * italic/highlight/link/citation marks instead of losing them.
 */
export function richTextToParagraphRuns(doc: RichTextDoc | null | undefined): { runs: { text: string; marks: RichTextMark[] }[] }[] {
  if (!doc || !Array.isArray(doc.content)) return [];
  return doc.content.reduce<{ runs: { text: string; marks: RichTextMark[] }[] }[]>((paragraphs, node) => {
    if (node.type !== "paragraph") return paragraphs;
    const runs = (node.content ?? []).reduce<{ text: string; marks: RichTextMark[] }[]>((acc, child) => {
      if (child.type === "text" && (child.text ?? "").length > 0) acc.push({ text: child.text ?? "", marks: child.marks ?? [] });
      return acc;
    }, []);
    paragraphs.push({ runs });
    return paragraphs;
  }, []);
}
