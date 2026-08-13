"use client";

import { CustomSelect, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { FieldValues, Path } from "react-hook-form";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";

/** Options come from `book.references` — there's no server round-trip needed (unlike the recipe picker), since the parent Content tab already holds the full book. */
export function citationPickerField<T extends FieldValues>(name: Path<T>, label: string, references: BookReference[]): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    description: references.length === 0 ? "Add a reference in the References tab first." : undefined,
    render: ({ field, error }) => (
      <CustomSelect
        name="referenceId"
        value={field.value ?? ""}
        onChange={field.onChange}
        error={error}
        placeholder="Select a reference"
        options={references.map((reference) => ({ label: reference.label, value: reference.id }))}
      />
    ),
  };
}
