"use client";

import { buildAppHref } from "@kira-joo/frontend-toolkit-core";
import { CustomForm, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import { CreateBookFormValues } from "../interfaces/book.interface";
import { AppRoute } from "../routes/app-route";
import type { createBookEndpoint } from "../../../api/book.endpoints";

/**
 * Deliberately minimal — a Book is created essentially empty and the
 * doctor is taken straight into its editor, rather than being asked to
 * fill out a large form up front.
 */
export function CreateBookForm({ endpoint }: { endpoint: typeof createBookEndpoint }) {
  const router = useRouter();

  const fields: FormFieldConfig<CreateBookFormValues>[] = [
    { type: FieldType.INPUT, name: "title", label: "Title", rules: { required: true } },
    { type: FieldType.INPUT, name: "subtitle", label: "Subtitle" },
    {
      type: FieldType.INPUT,
      name: "slug",
      label: "Slug",
      description: "Used in the book's URL — lowercase letters, numbers, and hyphens only",
      rules: { required: true, pattern: { value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "lowercase letters, numbers, and hyphens only" } },
    },
    { type: FieldType.INPUT, name: "category", label: "Category" },
  ];

  return (
    <CustomForm<CreateBookFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{ title: "", subtitle: "", slug: "", category: "" }}
      submitEndpoint={endpoint}
      onSuccess={(book) => router.push(buildAppHref(AppRoute.bookOverview, { id: book._id }))}
      layout="grid"
      columns={2}
      submitButtonText="Create book"
    />
  );
}
