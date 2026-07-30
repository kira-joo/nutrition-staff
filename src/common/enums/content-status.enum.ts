/**
 * Draft/published state for editorial content modules (Review, and every
 * future content-managed collection) — distinct from `Status`
 * (active/inactive), which is about a *record's* standing (e.g. a staff
 * user or role), not whether *content* is publicly visible yet.
 */
export enum ContentStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}
