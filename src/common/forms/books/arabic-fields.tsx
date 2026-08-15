"use client";

import { CustomInput, CustomTextarea, FieldType, type FormFieldConfig, type SimpleValidationRules } from "@kira-joo/frontend-toolkit-tailwind";
import type { FieldValues, Path } from "react-hook-form";

/**
 * No toolkit field config accepts `dir`, and `text-align: right` alone
 * does not fix bidi ordering of mixed Arabic/Latin/punctuation — so every
 * Arabic text field in Books is `FieldType.CUSTOM` behind these two small
 * factories, rather than a package change made mid-feature. Recorded as a
 * toolkit candidate, not acted on here.
 */
export function arabicInput<T extends FieldValues>(
  name: Path<T>,
  label: string,
  options?: { placeholder?: string; rules?: SimpleValidationRules; description?: string }
): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    description: options?.description,
    rules: options?.rules,
    render: ({ field, error }) => (
      <CustomInput
        name={field.name}
        value={(field.value as string) ?? ""}
        onChange={field.onChange}
        onBlur={field.onBlur}
        ref={field.ref}
        dir="rtl"
        placeholder={options?.placeholder}
        error={error}
      />
    ),
  };
}

export function arabicTextarea<T extends FieldValues>(
  name: Path<T>,
  label: string,
  options?: { rows?: number; placeholder?: string; rules?: SimpleValidationRules; description?: string }
): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    description: options?.description,
    rules: options?.rules,
    render: ({ field, error }) => (
      <CustomTextarea
        name={field.name}
        value={(field.value as string) ?? ""}
        onChange={field.onChange}
        onBlur={field.onBlur}
        ref={field.ref}
        dir="rtl"
        rows={options?.rows ?? 4}
        placeholder={options?.placeholder}
        error={error}
      />
    ),
  };
}
