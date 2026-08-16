"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomSelect, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { getBookPrintPreviewEndpoint } from "../../../../../api/book-preview.endpoints";
import { getBookByIdEndpoint } from "../../../../../api/book.endpoints";

/**
 * Renders the SAME self-contained HTML the (future) PDF renderer would
 * consume, injected via `<iframe srcDoc>` rather than `<iframe src>` —
 * the staff bearer token lives in `localStorage`, not a cookie, so a
 * direct `src` request to the print-preview route would be
 * unauthenticated. Preview fidelity is guaranteed by construction: same
 * template, same paginator, same fonts as whatever eventually generates
 * the PDF in Phase F.
 *
 * Page numbers here are PROVISIONAL — this staff browser's own
 * line-breaking can differ by a line or two from whatever engine
 * eventually renders the authoritative PDF (different browsers, even
 * different versions of the same engine, do not guarantee byte-identical
 * text layout). Never treat a draft preview's page count as
 * authoritative; that only exists once Phase F's real generation runs.
 */
export default function BookPreviewPage({ params }: { params: { id: string } }) {
  const bookQuery = useRequesterQuery({ endpoint: getBookByIdEndpoint, options: { params: { id: params.id } } });

  return <QueryState query={bookQuery}>{(book) => <PreviewFrame bookId={params.id} chapters={book.chapters} />}</QueryState>;
}

function PreviewFrame({ bookId, chapters }: { bookId: string; chapters: { id: string; title: string }[] }) {
  const [chapterId, setChapterId] = useState<string>("");

  // A draft preview must never be served from cache: the author is editing
  // the very content being rendered. `staleTime: 0` + refetch-on-mount means
  // reopening the tab after a block edit re-renders rather than replaying the
  // response captured when the tab first opened.
  const previewQuery = useRequesterQuery({
    endpoint: getBookPrintPreviewEndpoint,
    options: { params: { id: bookId }, query: chapterId ? { chapterId } : {} },
    queryOptions: { staleTime: 0, gcTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <CustomSelect
          name="preview-scope"
          value={chapterId}
          onChange={(value) => setChapterId(Array.isArray(value) ? value[0] : value)}
          options={[{ label: "Whole book", value: "" }, ...chapters.map((chapter) => ({ label: chapter.title, value: chapter.id }))]}
          wrapperClassName="w-64"
        />
        <CustomButton type="button" variant="outline" leftIcon={RefreshCw} loading={previewQuery.isFetching} onClick={() => previewQuery.refetch()}>
          Refresh preview
        </CustomButton>
        <span className="text-xs text-slate-500">Page numbers shown are provisional</span>
      </div>

      <div className="flex justify-center overflow-auto rounded-md border border-slate-200 bg-slate-100 p-6">
        {previewQuery.isLoading ? (
          <p className="py-20 text-sm text-slate-500">Rendering preview…</p>
        ) : previewQuery.isError ? (
          <p className="py-20 text-sm text-red-600">Failed to render preview.</p>
        ) : (
          <iframe
            // Keyed on the rendered HTML's length so React replaces the
            // element outright when the document changes. An iframe does not
            // reliably re-parse a mutated srcDoc, which could otherwise keep
            // an older document on screen even once fresh HTML has arrived.
            key={(previewQuery.data ?? "").length}
            title="Book print preview"
            srcDoc={previewQuery.data ?? ""}
            sandbox="allow-scripts allow-same-origin"
            className="h-[80vh] w-full max-w-3xl border-0 bg-white shadow-md"
          />
        )}
      </div>
    </div>
  );
}
