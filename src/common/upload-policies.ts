// Re-exported here for the same reason as `common/authorization/app-permission.ts`:
// client forms need these policy objects (to drive FeatureImageUpload's
// client-side pre-check), but importing straight from `src/server/*` blurs
// that folder's naming convention over time. `upload-policies.ts` itself has
// zero server-only dependencies (just plain data shaped by a type from
// `@kira-joo/toolkit-common`), so this re-export is a plain literal, not a
// live/heavier module.
export { reviewImagePolicy } from "../server/core/assets/upload-policies";
