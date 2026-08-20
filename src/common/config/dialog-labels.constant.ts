import type { DialogLabels } from "@kira-joo/frontend-toolkit-tailwind/dialog";

/**
 * The dialog system's default copy, owned here rather than in the toolkit —
 * the package deliberately ships no English, so every consumer states its own
 * strings once and individual call sites override only where a specific dialog
 * needs different wording.
 *
 * This app has no i18n layer (English-only staff tooling), so these are plain
 * literals. A localized consumer passes translated values from its own
 * translation layer instead.
 */
export const DIALOG_LABELS: DialogLabels = {
  close: "Close",
  confirm: "Confirm",
  cancel: "Cancel",
  save: "Save",
  fallbackMessage: "Nothing to show",
};
