"use client";

import { CustomInput, CustomTextarea } from "@kira-joo/frontend-toolkit-tailwind";
import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";

export interface LocalizedTextPairProps {
  label: string;
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  multiline?: boolean;
  /** Initial textarea height when `multiline`; the field stays manually resizable (vertical-only, via CustomTextarea). Defaults to a compact 2. */
  rows?: number;
}

/**
 * Same "two independent inputs, one per locale" idea as
 * `FormLocalizedInput`/`FormLocalizedTextarea`, but for a plain value
 * inside a local array (bioSections/programHighlights/whyChooseReasons) —
 * those live in `ArrayFieldEditor`'s own `value`/`onChange`, not as
 * individually RHF-registered fields, so the toolkit's RHF-bound
 * components don't apply here.
 */
export function LocalizedTextPair({ label, value, onChange, multiline = false, rows = 2 }: LocalizedTextPairProps) {
  if (multiline) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <CustomTextarea
          label={`${label} (English)`}
          rows={rows}
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.target.value })}
        />
        <CustomTextarea
          label={`${label} (Arabic)`}
          dir="rtl"
          rows={rows}
          value={value.ar}
          onChange={(event) => onChange({ ...value, ar: event.target.value })}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <CustomInput
        label={`${label} (English)`}
        value={value.en}
        onChange={(event) => onChange({ ...value, en: event.target.value })}
      />
      <CustomInput
        label={`${label} (Arabic)`}
        dir="rtl"
        value={value.ar}
        onChange={(event) => onChange({ ...value, ar: event.target.value })}
      />
    </div>
  );
}
