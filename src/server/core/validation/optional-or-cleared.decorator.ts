import { ValidateIf } from "class-validator";

/**
 * Marks a property as optional in the sense our forms actually mean:
 * absent OR explicitly cleared.
 *
 * `@IsOptional()` alone is not enough. class-validator skips a property
 * only when it is `undefined` or `null`, so an explicit empty string still
 * reaches every other validator on the field — and `""` is not a URL, not
 * an email, and matches almost no `@Matches` pattern. The result is that a
 * user who clears an optional URL cannot save the form at all, and neither
 * can anyone else editing that document while the field happens to be
 * blank.
 *
 * `""` reaching the DTO is deliberate, not a client bug. The form layer
 * (`@kira-joo/frontend-toolkit-tailwind` 0.5.3's `stripEmptyValues`) was
 * fixed specifically so ordinary string fields keep their explicit empty
 * string, because that is the ONLY way to express "clear this value" —
 * omitting the key means "leave it unchanged" under our update semantics.
 * So the fix belongs here, in validation, not by stripping `""` again
 * upstream.
 *
 * This decorator does NOT rewrite the value: `""` is passed through
 * untouched so the repository still clears the stored field. It only
 * suppresses the OTHER validators for the two non-values, leaving a
 * non-empty value fully validated.
 *
 *   @OptionalOrCleared()
 *   @IsUrl()
 *   websiteUrl?: string;
 *
 *   undefined / null -> skipped, field left absent
 *   ""               -> skipped, field cleared
 *   "https://x.com"  -> validated by @IsUrl()
 *   "not-a-url"      -> rejected by @IsUrl()
 *
 * Composes with any validator, so it replaces `@IsOptional()` on any
 * optional field whose other validators would reject an empty string.
 * Deliberately NOT applied to plain `@IsString()` fields: those already
 * accept `""`, and `@IsOptional()` there is still correct.
 */
export function OptionalOrCleared(): PropertyDecorator {
  return ValidateIf((_object: unknown, value: unknown) => value !== undefined && value !== null && value !== "");
}
