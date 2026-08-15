/**
 * Books' own lifecycle — deliberately separate from `ContentStatus`
 * (draft/published only). Adding `ARCHIVED` there would silently widen
 * every existing content module's DTOs to accept a state none of them
 * were designed for. `READY_FOR_REVIEW` is a label only (no reviewer
 * assignment, no locking, no approval gate) — publish is permitted from
 * either `DRAFT` or `READY_FOR_REVIEW`.
 */
export enum BookStatus {
  DRAFT = "draft",
  READY_FOR_REVIEW = "ready_for_review",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}
