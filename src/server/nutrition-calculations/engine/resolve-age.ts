export interface ResolvedAge {
  ageYears: number;
  /** True when derived from `birthYear` alone — the exact date of birth wasn't available, so the age may be off by up to a year. */
  isApproximate: boolean;
}

/** Returns `null` when neither is available — the caller decides how to handle a missing age (skipping BMR-dependent outputs, never guessing one). */
export function resolveAge(dateOfBirth: Date | undefined, birthYear: number | undefined, asOf: Date): ResolvedAge | null {
  if (dateOfBirth) {
    let age = asOf.getFullYear() - dateOfBirth.getFullYear();
    const hasHadBirthdayThisYear =
      asOf.getMonth() > dateOfBirth.getMonth() ||
      (asOf.getMonth() === dateOfBirth.getMonth() && asOf.getDate() >= dateOfBirth.getDate());
    if (!hasHadBirthdayThisYear) age--;
    return { ageYears: age, isApproximate: false };
  }

  if (birthYear) {
    return { ageYears: asOf.getFullYear() - birthYear, isApproximate: true };
  }

  return null;
}
