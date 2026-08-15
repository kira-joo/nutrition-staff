"use client";

import { Badge, CustomButton } from "@kira-joo/frontend-toolkit-tailwind";
import type { ReactNode } from "react";

export interface OverrideFieldProps {
  label: string;
  isOverridden: boolean;
  /** The books-default value, rendered read-only when NOT overridden. */
  renderDefault: () => ReactNode;
  /** The editable control, rendered when overridden. */
  renderOverride: () => ReactNode;
  onOverride: () => void;
  onReset: () => void;
}

/**
 * The shared affordance for every overridable BookSettings field:
 * "Using books default" / "Override for this book" / "Reset to books
 * default". Clicking "Override" seeds the editable control with the
 * current inherited value as a visible, user-initiated starting point —
 * nothing is copied until the doctor asks, and the copy is on screen, per
 * the plan's explicit "do not copy defaults invisibly" requirement.
 */
export function OverrideField({ label, isOverridden, renderDefault, renderOverride, onOverride, onReset }: OverrideFieldProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {isOverridden ? (
          <Badge variant="warning">Override for this book</Badge>
        ) : (
          <Badge variant="secondary">Using books default</Badge>
        )}
      </div>

      {isOverridden ? (
        <div className="space-y-2">
          {renderOverride()}
          <CustomButton type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset to books default
          </CustomButton>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-slate-500">{renderDefault()}</div>
          <CustomButton type="button" variant="outline" size="sm" onClick={onOverride}>
            Override for this book
          </CustomButton>
        </div>
      )}
    </div>
  );
}
