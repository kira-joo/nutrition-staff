"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { BookOpen, Image as ImageIcon, ToggleRight } from "lucide-react";
import { BookVisibility } from "../enums";
import { Book, BookFormValues } from "../interfaces/book.interface";
import { bookPortraitPolicy } from "../upload-policies";
import type { updateBookEndpoint } from "../../../api/book.endpoints";

export interface BookFormProps {
  book: Book;
  endpoint: typeof updateBookEndpoint;
  onSaved?: (book: Book) => void;
}

/**
 * Header-only editor — title/slug/cover/visibility/flags. Content
 * (chapters/front matter/back matter/references) is Phase C's own tab; this
 * route never touches it. `expectedRevision` is injected via
 * `transformValues`, never a visible field — the same pattern the campaign
 * block editors use to inject `type`.
 */
export function BookForm({ book, endpoint, onSaved }: BookFormProps) {
  const contentFields: FormFieldConfig<BookFormValues>[] = [
    { type: FieldType.INPUT, name: "title", label: "Title", rules: { required: true } },
    { type: FieldType.INPUT, name: "subtitle", label: "Subtitle" },
    { type: FieldType.INPUT, name: "slug", label: "Slug", rules: { required: true, pattern: { value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "lowercase letters, numbers, and hyphens only" } } },
    { type: FieldType.TEXTAREA, name: "shortDescription", label: "Short description", rows: 3 },
    { type: FieldType.INPUT, name: "category", label: "Category" },
    { type: FieldType.INPUT, name: "editionLabelTemplate", label: "Edition label template", placeholder: "الطبعة {n}" },
  ];

  const coverFields: FormFieldConfig<BookFormValues>[] = [
    { type: FieldType.IMAGE_ASSET, name: "coverImage", label: "Cover image", policy: bookPortraitPolicy },
    { type: FieldType.IMAGE_ASSET, name: "backCoverImage", label: "Back cover image", policy: bookPortraitPolicy },
  ];

  const visibilityFields: FormFieldConfig<BookFormValues>[] = [
    {
      type: FieldType.SELECT,
      name: "visibility",
      label: "Visibility",
      options: Object.values(BookVisibility).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
    { type: FieldType.SWITCH, name: "allowFlipbook", label: "Allow flipbook" },
    { type: FieldType.SWITCH, name: "allowPdfDownload", label: "Allow PDF download" },
    { type: FieldType.SWITCH, name: "showOnWebsite", label: "Show on website" },
  ];

  return (
    <CustomForm<BookFormValues, typeof endpoint>
      sections={[
        { title: "Content", icon: BookOpen, fields: contentFields },
        { title: "Cover", icon: ImageIcon, fields: coverFields },
        { title: "Visibility", icon: ToggleRight, fields: visibilityFields },
      ]}
      defaultValues={{
        title: book.title,
        subtitle: book.subtitle ?? "",
        slug: book.slug,
        shortDescription: book.shortDescription ?? "",
        category: book.category ?? "",
        editionLabelTemplate: book.editionLabelTemplate ?? "",
        coverImage: book.coverImage ?? null,
        backCoverImage: book.backCoverImage ?? null,
        visibility: book.visibility,
        allowFlipbook: book.allowFlipbook,
        allowPdfDownload: book.allowPdfDownload,
        showOnWebsite: book.showOnWebsite,
      }}
      submitEndpoint={endpoint}
      submitParams={{ id: book._id }}
      transformValues={(values) => ({ ...values, expectedRevision: book.revision })}
      warnOnUnsavedChanges
      onSuccess={(data) => {
        toast.success("Book saved");
        onSaved?.(data);
      }}
      layout="grid"
      columns={2}
    />
  );
}
