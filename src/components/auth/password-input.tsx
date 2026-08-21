"use client";

import { useState } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { CustomInput, END_CONTROL_BUTTON_CLASS } from "@kira-joo/frontend-toolkit-tailwind";

export interface PasswordInputProps<TFieldValues extends FieldValues = FieldValues> {
  field: ControllerRenderProps<TFieldValues>;
  label: string;
  error?: string;
}

/**
 * A labeled password input with a show/hide toggle. Used via `FieldType.CUSTOM`
 * — `CustomForm`'s own renderer already wraps this in a `Controller`, so this
 * component only needs the resolved `field`/`error`, not `control`/`name`.
 *
 * The label, input, error message and `aria-describedby` wiring used to be
 * hand-rolled here, duplicating what `CustomInput` already does — along with a
 * hardcoded slate palette and a physically-positioned (`right-2`) toggle. All
 * of that is now the toolkit's, leaving only what is actually specific to a
 * password field: the visibility state, and the toggle in the `endControl`
 * slot.
 *
 * `endControl` rather than `rightIcon` because the toggle is *operable*;
 * `rightIcon` is rendered `pointer-events-none` and `aria-hidden`, so a button
 * placed there could not be clicked or reached. The slot also stretches its
 * child to the input's full height, which is why the toggle is now a real
 * target instead of the 24px box it was.
 *
 * The accessible name says which field it toggles ("Show current password"),
 * not just "Show password" — three of these render together on the
 * change-password screen, and a screen reader user needs to tell them apart.
 */
export function PasswordInput<TFieldValues extends FieldValues = FieldValues>({
  field,
  label,
  error,
}: PasswordInputProps<TFieldValues>) {
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <CustomInput
      {...field}
      label={label}
      error={error}
      type={visible ? "text" : "password"}
      endControl={
        <button
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className={END_CONTROL_BUTTON_CLASS}
        >
          <ToggleIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      }
    />
  );
}
