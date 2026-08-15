"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { BookOpen, Image as ImageIcon, ToggleRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { BookVisibility } from "../enums";
import { Book, BookFormValues, type BookCoverMode } from "../interfaces/book.interface";
import { bookPortraitPolicy } from "../upload-policies";
import { CoverModeField } from "./books/cover-mode-field";
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
  // An external `useForm` instance (rather than letting `CustomForm` own
  // one internally) is what lets the two FieldType.CUSTOM cover-mode
  // fields below read/write `coverMode`/`backCoverMode` via `field`/`form`
  // — the same recipe `client-profile-form.tsx` already uses for a
  // value-dependent field. Passing `form` to `CustomForm` means its OWN
  // `defaultValues` prop is unused for an external form, so defaults are
  // set here instead. `?? "generated"` guards books saved before this
  // field existed, where it's genuinely absent in storage.
  const form = useForm<BookFormValues>({
    defaultValues: {
      title: book.title,
      subtitle: book.subtitle ?? "",
      slug: book.slug,
      shortDescription: book.shortDescription ?? "",
      category: book.category ?? "",
      editionLabelTemplate: book.editionLabelTemplate ?? "",
      coverMode: book.coverMode ?? "generated",
      coverImage: book.coverImage ?? null,
      backCoverMode: book.backCoverMode ?? "generated",
      backCoverImage: book.backCoverImage ?? null,
      visibility: book.visibility,
      allowFlipbook: book.allowFlipbook,
      allowPdfDownload: book.allowPdfDownload,
      showOnWebsite: book.showOnWebsite,
    },
  });

  const contentFields: FormFieldConfig<BookFormValues>[] = [
    { type: FieldType.INPUT, name: "title", label: "Title", rules: { required: true } },
    { type: FieldType.INPUT, name: "subtitle", label: "Subtitle" },
    { type: FieldType.INPUT, name: "slug", label: "Slug", rules: { required: true, pattern: { value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "lowercase letters, numbers, and hyphens only" } } },
    { type: FieldType.TEXTAREA, name: "shortDescription", label: "Short description", rows: 3 },
    { type: FieldType.INPUT, name: "category", label: "Category" },
    { type: FieldType.INPUT, name: "editionLabelTemplate", label: "Edition label template", placeholder: "الطبعة {n}" },
  ];

  // `coverImage`/`backCoverImage` stay declared as ordinary, standalone
  // `FieldType.IMAGE_ASSET` fields (unchanged from before this feature) —
  // only their `hidden` flag is now driven by the watched `*Mode` value,
  // the exact recipe `client-profile-form.tsx` already uses for a
  // value-dependent field. This matters beyond visuals: `CustomForm`'s
  // submit whitelist and multipart/asset detection (`getFieldNames`/
  // `getAssetFieldNames`) both key off which fields are DECLARED in this
  // config array, not what's actually rendered — an image field that only
  // existed inside a CUSTOM field's own render tree would silently never
  // reach the submit payload at all. `hidden` keeps the field mounted
  // (CSS-only), so the existing image survives any number of mode
  // switches; only its own "Remove" action can clear it.
  const coverMode = form.watch("coverMode");
  const backCoverMode = form.watch("backCoverMode");
  const coverImageValue = form.watch("coverImage");
  const backCoverImageValue = form.watch("backCoverImage");

  const coverFields: FormFieldConfig<BookFormValues>[] = [
    {
      type: FieldType.CUSTOM,
      name: "coverMode",
      label: "Front Cover",
      colSpan: "full",
      render: ({ field }) => (
        <CoverModeField
          sectionLabel="Front Cover"
          modeValue={field.value as BookCoverMode}
          onModeChange={field.onChange}
          hasImage={Boolean(coverImageValue)}
          generatedDescription="Template-generated cover using the book's title, subtitle, and doctor identity."
          uploadedDescription="Your image becomes the complete A5 front cover, full-bleed, with no generated text over it."
        />
      ),
    },
    { type: FieldType.IMAGE_ASSET, name: "coverImage", label: "Cover image", policy: bookPortraitPolicy, hidden: coverMode !== "uploaded", colSpan: "full" },
    {
      type: FieldType.CUSTOM,
      name: "backCoverMode",
      label: "Back Cover",
      colSpan: "full",
      render: ({ field }) => (
        <CoverModeField
          sectionLabel="Back Cover"
          modeValue={field.value as BookCoverMode}
          onModeChange={field.onChange}
          hasImage={Boolean(backCoverImageValue)}
          generatedDescription="Uses the book's resolved contact/identity content over the existing back-cover template."
          uploadedDescription="Your image becomes the complete A5 back cover, full-bleed, with no generated content over it."
        />
      ),
    },
    {
      type: FieldType.IMAGE_ASSET,
      name: "backCoverImage",
      label: "Back cover image",
      policy: bookPortraitPolicy,
      hidden: backCoverMode !== "uploaded",
      colSpan: "full",
    },
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
      form={form}
      sections={[
        { title: "Content", icon: BookOpen, fields: contentFields },
        { title: "Cover", icon: ImageIcon, fields: coverFields },
        { title: "Visibility", icon: ToggleRight, fields: visibilityFields },
      ]}
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
