"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { getBookByIdEndpoint } from "../../../../../api/book.endpoints";
import type { Book } from "src/common/interfaces/book.interface";
import { BookBlockList } from "src/common/book-blocks/book-block-list";
import { useBookContentQueue } from "src/common/books/use-book-content-queue";
import { useUnsavedChangesGuard } from "src/common/books/use-unsaved-changes-guard";

export default function BookFrontMatterPage({ params }: { params: { id: string } }) {
  const bookQuery = useRequesterQuery({ endpoint: getBookByIdEndpoint, options: { params: { id: params.id } } });

  return <QueryState query={bookQuery}>{(book) => <FrontMatterEditor key={book._id} initialBook={book} />}</QueryState>;
}

function FrontMatterEditor({ initialBook }: { initialBook: Book }) {
  const { book, enqueue, flush, isSaving } = useBookContentQueue(initialBook);
  useUnsavedChangesGuard(isSaving, flush);

  return (
    <div className="flex flex-col gap-6">
      {isSaving ? <p className="text-xs text-slate-500">Saving…</p> : null}
      <section>
        <h3 className="mb-2 font-semibold" dir="rtl">نبذة عن الكتاب (About the book)</h3>
        <BookBlockList
          bookId={initialBook._id}
          book={book}
          container={{ kind: "frontMatter", slot: "aboutBook" }}
          blocks={book.frontMatter.aboutBook.blocks}
          enqueue={enqueue}
        />
      </section>
      <section>
        <h3 className="mb-2 font-semibold" dir="rtl">المقدمة (Introduction)</h3>
        <BookBlockList
          bookId={initialBook._id}
          book={book}
          container={{ kind: "frontMatter", slot: "introduction" }}
          blocks={book.frontMatter.introduction.blocks}
          enqueue={enqueue}
        />
      </section>
    </div>
  );
}
