"use client";

import { useId, useState } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps<TFieldValues extends FieldValues = FieldValues> {
  field: ControllerRenderProps<TFieldValues>;
  label: string;
  error?: string;
}

/**
 * A labeled password input with a show/hide toggle. Used via `FieldType.CUSTOM`
 * — `CustomForm`'s own renderer already wraps this in a `Controller`, so this
 * component only needs the resolved `field`/`error`, not `control`/`name`.
 */
export function PasswordInput<TFieldValues extends FieldValues = FieldValues>({
  field,
  label,
  error,
}: PasswordInputProps<TFieldValues>) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          {...field}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
