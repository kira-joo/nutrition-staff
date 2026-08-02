export interface ProfileCompletenessInput {
  dateOfBirth?: string;
  gender?: string;
  heightCm?: number;
  source?: string;
}

export interface ProfileCompleteness {
  filled: number;
  total: number;
}

/**
 * Derived, never stored — a quick "how ready is this record" signal.
 * `hasMeasurement` is optional so a list view (which would need an extra
 * cross-collection lookup per row to know it) can compute a lighter-weight
 * version than the Client Overview (which already has the latest
 * measurement in hand) without duplicating this logic in two places.
 */
export function calculateProfileCompleteness(client: ProfileCompletenessInput, hasMeasurement?: boolean): ProfileCompleteness {
  const checks: unknown[] = [client.dateOfBirth, client.gender, client.heightCm, client.source];
  if (hasMeasurement !== undefined) checks.push(hasMeasurement);
  return { filled: checks.filter(Boolean).length, total: checks.length };
}
