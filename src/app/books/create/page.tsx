"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { BookOpen } from "lucide-react";
import { createBookEndpoint } from "../../../../api/book.endpoints";
import { CreateBookForm } from "src/common/forms/create-book-form";
import { AppRoute } from "src/common/routes/app-route";

export default function BookCreatePage() {
  return (
    <PageShell
      icon={BookOpen}
      title="New Book"
      description="Create an empty book, then add content in its editor"
      backRoute={{ path: AppRoute.books, label: "Back to Books" }}
    >
      <CreateBookForm endpoint={createBookEndpoint} />
    </PageShell>
  );
}
