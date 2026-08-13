"use client";

import { BookBlockType } from "src/common/enums";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import { renderRichTextToHtml } from "src/common/books/rich-text/render-rich-text";

/** 9 preview components for 17 block types — grouped by rendered shape, not one-per-type, mirroring the "5 previews, 17 mappings" scaling decision recorded in the architecture plan for a module with 2.5x Campaign's type count. */

export function TextBlockPreview({ block }: { block: BookBlock }) {
  if (block.type !== BookBlockType.HEADING && block.type !== BookBlockType.SUBHEADING) return null;
  const Tag = block.type === BookBlockType.HEADING ? "h3" : "h4";
  return <Tag className="text-right font-semibold" dir="rtl">{block.text}</Tag>;
}

export function RichTextBlockPreview({ block }: { block: BookBlock }) {
  if (block.type === BookBlockType.PARAGRAPH) {
    return <div className="text-right text-sm" dir="rtl" dangerouslySetInnerHTML={{ __html: renderRichTextToHtml(block.richText) }} />;
  }
  if (block.type === BookBlockType.QUOTE) {
    return (
      <blockquote className="border-r-2 border-slate-300 pr-3 text-right text-sm italic" dir="rtl">
        <div dangerouslySetInnerHTML={{ __html: renderRichTextToHtml(block.richText) }} />
        {block.attribution ? <cite className="mt-1 block text-xs not-italic text-slate-500">— {block.attribution}</cite> : null}
      </blockquote>
    );
  }
  if (block.type === BookBlockType.TIP || block.type === BookBlockType.NOTE || block.type === BookBlockType.WARNING) {
    return (
      <div className="rounded-md bg-slate-50 p-2 text-right text-sm" dir="rtl">
        {block.title ? <p className="font-semibold">{block.title}</p> : null}
        <div dangerouslySetInnerHTML={{ __html: renderRichTextToHtml(block.richText) }} />
      </div>
    );
  }
  return null;
}

export function ImageBlockPreview({ block }: { block: BookBlock }) {
  if (block.type !== BookBlockType.IMAGE) return null;
  return (
    <figure className="text-right" dir="rtl">
      {block.image ? <img src={block.image.secureUrl} alt={block.caption ?? ""} className="max-h-40 rounded-md" /> : <p className="text-sm text-slate-400">No image</p>}
      {block.caption ? <figcaption className="mt-1 text-xs text-slate-500">{block.caption}</figcaption> : null}
    </figure>
  );
}

export function ListBlockPreview({ block }: { block: BookBlock }) {
  if (block.type === BookBlockType.BULLET_LIST) {
    return (
      <ul className="list-inside list-disc text-right text-sm" dir="rtl">
        {block.items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    );
  }
  if (block.type === BookBlockType.NUMBERED_LIST) {
    return (
      <ol className="list-inside list-decimal text-right text-sm" dir="rtl">
        {block.items.map((item, index) => <li key={index}>{item}</li>)}
      </ol>
    );
  }
  if (block.type === BookBlockType.CHECKLIST) {
    return (
      <ul className="text-right text-sm" dir="rtl">
        {block.items.map((item) => (
          <li key={item.id} className="flex items-center justify-end gap-2">
            <span>{item.text}</span>
            <input type="checkbox" checked={item.checked} readOnly />
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

export function TableBlockPreview({ block }: { block: BookBlock }) {
  if (block.type !== BookBlockType.TABLE) return null;
  return (
    <table className="w-full border-collapse text-right text-xs" dir="rtl">
      <thead>
        <tr>{block.headers.map((header, index) => <th key={index} className="border border-slate-200 p-1">{header}</th>)}</tr>
      </thead>
      <tbody>
        {block.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-slate-200 p-1">{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export function SimpleBlockPreview({ block }: { block: BookBlock }) {
  if (block.type === BookBlockType.PAGE_BREAK) {
    return <div className="border-t border-dashed border-slate-400 py-2 text-center text-xs text-slate-500">──── بداية صفحة جديدة ────</div>;
  }
  if (block.type === BookBlockType.DIVIDER) {
    return <hr className="border-slate-300" />;
  }
  return null;
}

export function QrLinkBlockPreview({ block }: { block: BookBlock }) {
  if (block.type !== BookBlockType.QR_LINK) return null;
  return (
    <div className="text-right text-sm" dir="rtl">
      <p className="font-medium">{block.label ?? "QR link"}</p>
      <p className="truncate text-xs text-slate-500" dir="ltr">{block.destination}</p>
    </div>
  );
}

export function RecipeRefBlockPreview({ block }: { block: BookBlock }) {
  if (block.type !== BookBlockType.RECIPE_REF) return null;
  return <p className="text-right text-sm" dir="rtl">{block.displayTitle ?? `Recipe: ${block.recipeId}`}</p>;
}

export function CitationBlockPreview({ block }: { block: BookBlock }) {
  if (block.type !== BookBlockType.CITATION) return null;
  return <p className="text-right text-xs text-slate-500" dir="rtl">Reference: {block.referenceId}</p>;
}
