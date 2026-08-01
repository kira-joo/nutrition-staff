/**
 * `UNSPECIFIED` is a real, selectable value (not just "not set") — it exists
 * because the Nutrition Calculation Workspace's BMR formula requires a
 * male/female coefficient, and a client who hasn't disclosed gender must
 * still be calculable. The workspace must surface an explicit warning and
 * record the assumption used rather than silently defaulting.
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  UNSPECIFIED = "unspecified",
}
