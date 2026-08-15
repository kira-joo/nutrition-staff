"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { getBookByIdEndpoint } from "../../../../../api/book.endpoints";
import type { Book } from "src/common/interfaces/book.interface";
import { ReferencesEditor } from "src/common/book-blocks/references-editor";
import { useBookContentQueue } from "src/common/books/use-book-content-queue";
import { useUnsavedChangesGuard } from "src/common/books/use-unsaved-changes-guard";

export default function BookReferencesPage({ params }: { params: { id: string } }) {
  const bookQuery = useRequesterQuery({ endpoint: getBookByIdEndpoint, options: { params: { id: params.id } } });

  return <QueryState query={bookQuery}>{(book) => <ReferencesTab key={book._id} initialBook={book} />}</QueryState>;
}

function ReferencesTab({ initialBook }: { initialBook: Book }) {
  const { book, enqueue, flush, isSaving } = useBookContentQueue(initialBook);
  useUnsavedChangesGuard(isSaving, flush);

  return (
    <div className="flex flex-col gap-3">
      {isSaving ? <p className="text-xs text-slate-500">Saving…</p> : null}
      <ReferencesEditor bookId={initialBook._id} book={book} enqueue={enqueue} />
    </div>
  );
}
