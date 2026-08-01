/**
 * A derived filter over `User` based on which optional profiles exist for
 * it — never stored, always computed by checking `ClientProfile`/
 * `StaffProfile` for a matching `userId`. Fully partitions every `User`
 * into exactly one of these four categories.
 */
export enum ProfileType {
  IDENTITY_ONLY = "identity_only",
  CLIENT_ONLY = "client_only",
  STAFF_ONLY = "staff_only",
  BOTH = "both",
}
