/**
 * Only the two values the BMR formula's coefficient actually needs.
 * "Not specified" is represented by the field being absent (optional
 * everywhere it's used), not by a sentinel value. In the Calculation
 * Workspace, `gender` is a single, local, per-calculation input (like
 * every other input there) — when it's absent, BMR-dependent outputs are
 * simply not calculated rather than guessed; there is no separate
 * "override" field.
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
}
