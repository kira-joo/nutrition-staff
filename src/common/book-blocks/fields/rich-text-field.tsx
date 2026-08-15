"use client";

import { FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { FieldValues, Path } from "react-hook-form";
import { RichTextEditor } from "src/common/books/rich-text/rich-text-editor";
import type { RichTextDoc } from "src/common/books/rich-text/rich-text-doc.interface";

export function richTextField<T extends FieldValues>(
  name: Path<T>,
  label: string,
  referenceOptions: { id: string; label: string }[] = []
): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    render: ({ field, error }) => (
      <RichTextEditor value={field.value as RichTextDoc} onChange={field.onChange} referenceOptions={referenceOptions} error={error} />
    ),
  };
}
