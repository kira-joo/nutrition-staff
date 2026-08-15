"use client";

import type { ApiError, Endpoint } from "@kira-joo/frontend-toolkit-core";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { CustomForm, toast } from "@kira-joo/frontend-toolkit-tailwind";
import type { BookBlockType } from "src/common/enums";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";
import type { Book } from "src/common/interfaces/book.interface";
import { bookBlockRegistry } from "./book-block-registry";

/** Every block add/replace endpoint (chapter or section container) shares this exact shape — see the doc comment on the params types in `book-content.endpoints.ts`. */
export type BookBlockEndpoint = Endpoint<{ params: Record<string, string>; body: Record<string, unknown>; returnType: Book }>;

export interface BookBlockFormProps {
  blockType: BookBlockType;
  defaultBlock?: BookBlock;
  references: BookReference[];
  endpoint: BookBlockEndpoint;
  submitParams: Record<string, string>;
  expectedRevision: number;
  onSuccess: () => void;
}

/**
 * Every block add/replace route is multipart-only regardless of block
 * type (see `book-block-list.tsx`'s route comment: "a block may carry an
 * image"), but `CustomForm`'s own `submitEndpoint` path only switches to
 * a multipart body when the CURRENTLY RENDERED field set
 * (`bookBlockRegistry[blockType].fields()`) itself declares an
 * IMAGE_ASSET field — true only for IMAGE, false for the other 17 types.
 * Submitting through `submitEndpoint` for any non-IMAGE type therefore
 * sent a plain JSON body the server's `parseMultipartFormData` rejected
 * outright ("Request body must be multipart/form-data") — caught live
 * trying to add a plain PARAGRAPH, so this was never specific to one
 * block type. Fixed the same way `handleAddImmediate` in
 * `book-block-list.tsx` already handles PAGE_BREAK/DIVIDER (and the same
 * shape `doctor-profile-gallery.tsx`'s `buildGalleryFormData` uses): skip
 * `submitEndpoint`'s per-render asset detection entirely via `onSubmit`,
 * and always build the multipart body ourselves — a `File` value becomes
 * a file part (the only type that currently has one is IMAGE), anything
 * else goes into the JSON `payload` field, exactly as `buildSubmitBody`
 * would for a form that DOES declare an asset field.
 */
export function BookBlockForm({ blockType, defaultBlock, references, endpoint, submitParams, expectedRevision, onSuccess }: BookBlockFormProps) {
  const entry = bookBlockRegistry[blockType];

  const mutation = useRequesterMutation({
    endpoint,
    onSuccess: () => {
      toast.success(defaultBlock ? "Block updated" : "Block added");
      onSuccess();
    },
    onError: (error: ApiError) => toast.error(error.message),
  });

  function handleSubmit(values: Record<string, unknown>): void {
    const payload = { ...entry.transformSubmit(values), type: blockType, expectedRevision };
    const formData = new FormData();
    const jsonPayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload) as [string, unknown][]) {
      if (value instanceof File) formData.set(key, value);
      else jsonPayload[key] = value;
    }
    formData.set("payload", JSON.stringify(jsonPayload));
    mutation.mutate({ params: submitParams, body: formData as unknown as Record<string, unknown> });
  }

  return (
    <CustomForm<Record<string, unknown>>
      fields={entry.fields({ references })}
      defaultValues={entry.defaultValues(defaultBlock)}
      onSubmit={handleSubmit}
      loading={mutation.loading}
      submitButtonText={defaultBlock ? "Save changes" : "Add block"}
      layout="grid"
      columns={1}
    />
  );
}
