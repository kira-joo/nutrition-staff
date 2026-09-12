"use client";
import { use } from "react";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { getBookByIdEndpoint, updateBookEndpoint } from "../../../../../api/book.endpoints";
import { BookForm } from "src/common/forms/book-form";

export default function BookOverviewPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const bookQuery = useRequesterQuery({ endpoint: getBookByIdEndpoint, options: { params: { id: params.id } } });

  return (
    <QueryState query={bookQuery}>
      {(book) => <BookForm book={book} endpoint={updateBookEndpoint} onSaved={() => bookQuery.refetch()} />}
    </QueryState>
  );
}
