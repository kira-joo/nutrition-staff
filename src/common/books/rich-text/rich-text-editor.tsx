"use client";

import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Italic, Highlighter, Link as LinkIcon, Quote } from "lucide-react";
import { useEffect } from "react";
import { EMPTY_RICH_TEXT_DOC, type RichTextDoc } from "./rich-text-doc.interface";
import { BoldMark, CitationMark, HighlightMark, ItalicMark, LinkMark } from "./tiptap-extensions";

const SAFE_HREF_PATTERN = /^(https?:\/\/|\/)/;

export interface RichTextEditorProps {
  value: RichTextDoc;
  onChange: (doc: RichTextDoc) => void;
  /** Reference ids valid for a "citation" mark on this book — the toolbar's citation button is disabled with none. */
  referenceOptions?: { id: string; label: string }[];
  error?: string;
}

/**
 * Selection-based inline formatting only — bold/italic/highlight/link/
 * citation apply to whatever text is currently selected, never to a
 * whole paragraph or block. The schema itself (Document/Paragraph/Text +
 * exactly these 5 marks, no others registered) is what makes font
 * family/size/colour/margin/alignment impossible here — not editor
 * restraint. See `tiptap-extensions.ts` for why these 5 marks are
 * hand-written rather than the official Tiptap packages.
 */
export function RichTextEditor({ value, onChange, referenceOptions = [], error }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, BoldMark, ItalicMark, HighlightMark, LinkMark, CitationMark],
    content: value ?? EMPTY_RICH_TEXT_DOC,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichTextDoc),
    editorProps: {
      attributes: { dir: "rtl", class: "book-rich-text-editor min-h-[6rem] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none" },
    },
    immediatelyRender: false,
  });

  // Keep the editor in sync when `value` changes from outside (e.g. switching which block is being edited).
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value ?? EMPTY_RICH_TEXT_DOC);
    if (current !== next) editor.commands.setContent(value ?? EMPTY_RICH_TEXT_DOC);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) return null;

  function toggleLink(): void {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetMark("link").run();
      return;
    }
    const href = window.prompt("Link URL (https:// or a relative path):");
    if (!href || !SAFE_HREF_PATTERN.test(href)) return;
    editor.chain().focus().setMark("link", { href }).run();
  }

  function toggleCitation(): void {
    if (!editor) return;
    if (editor.isActive("citation")) {
      editor.chain().focus().unsetMark("citation").run();
      return;
    }
    if (referenceOptions.length === 0) return;
    const referenceId = referenceOptions[0].id;
    editor.chain().focus().setMark("citation", { referenceId }).run();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleMark("bold").run()} label="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleMark("italic").run()} label="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleMark("highlight").run()} label="Highlight">
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("link")} onClick={toggleLink} label="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("citation")}
          onClick={toggleCitation}
          label="Citation"
          disabled={referenceOptions.length === 0 && !editor.isActive("citation")}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded p-1.5 ${active ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-200"} ${disabled ? "opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}
