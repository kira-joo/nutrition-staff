export interface ProfileCompletenessInput {
  dateOfBirth?: string;
  gender?: string;
  heightCm?: number;
  source?: string;
  hasMeasurement: boolean;
}

export interface MissingProfileItem {
  key: string;
  label: string;
}

export interface ProfileCompletenessResult {
  completed: number;
  total: number;
  percentage: number;
  missing: MissingProfileItem[];
}

interface CompletenessCheck {
  key: string;
  label: string;
  isComplete: (input: ProfileCompletenessInput) => boolean;
}

/**
 * The one definition of what makes a ClientProfile "complete" — every
 * consumer (Clients table, Client Overview, the Dashboard's incomplete-
 * profile attention list) must call `calculateProfileCompleteness` with the
 * same input shape and read `total`/`missing` from its result, never
 * duplicate this field list or the completed/total math locally. Previously
 * `hasMeasurement` was an optional second argument some callers omitted
 * (to avoid an extra cross-collection lookup), which silently changed
 * `total` from 5 to 4 depending on which surface rendered it — that's why
 * it's now a required field on the input instead: every caller must
 * resolve it (see `listClients`'s single batched lookup for how to do that
 * cheaply for a whole page of rows at once).
 */
const COMPLETENESS_CHECKS: CompletenessCheck[] = [
  { key: "dateOfBirth", label: "Missing date of birth", isComplete: (input) => Boolean(input.dateOfBirth) },
  { key: "gender", label: "Missing gender", isComplete: (input) => Boolean(input.gender) },
  { key: "heightCm", label: "Missing height", isComplete: (input) => Boolean(input.heightCm) },
  { key: "source", label: "Missing source", isComplete: (input) => Boolean(input.source) },
  { key: "hasMeasurement", label: "No measurement recorded", isComplete: (input) => input.hasMeasurement },
];

export function calculateProfileCompleteness(input: ProfileCompletenessInput): ProfileCompletenessResult {
  const missing = COMPLETENESS_CHECKS.filter((check) => !check.isComplete(input)).map(({ key, label }) => ({ key, label }));
  const total = COMPLETENESS_CHECKS.length;
  const completed = total - missing.length;
  return { completed, total, percentage: Math.round((completed / total) * 100), missing };
}
