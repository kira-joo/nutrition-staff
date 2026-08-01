/**
 * The BMR formula's required male/female coefficient — distinct from
 * `Gender` (which includes `UNSPECIFIED`). Only used as an explicit,
 * per-calculation override when the client's `Gender` is `UNSPECIFIED`;
 * never inferred or defaulted silently.
 */
export enum BmrSex {
  MALE = "male",
  FEMALE = "female",
}
