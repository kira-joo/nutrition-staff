/**
 * Only the two values the BMR formula's coefficient actually needs.
 * "Not specified" is represented by the field being absent (optional
 * everywhere it's used), not by a sentinel value — the Calculation
 * Workspace treats an absent gender the same way whether it's genuinely
 * unknown or just not yet recorded, requiring an explicit per-calculation
 * override (bmrGenderOverride, also typed `Gender`) rather than guessing.
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
}
