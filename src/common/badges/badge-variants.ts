import { BookStatus, ClientLifecycle } from "src/common/enums";

/**
 * The subset of `Badge`'s `variant` prop that business-status maps in this
 * app actually use — not the full toolkit union (`default`/`outline` have no
 * business meaning here).
 */
export type StatusBadgeVariant = "success" | "secondary" | "warning" | "destructive";

/**
 * Single source of truth for how a client's CRM lifecycle reads as a Badge,
 * everywhere it appears (Clients list, Client details header, Consultation
 * requests, Dashboard follow-ups). Previously hand-duplicated in all four
 * places; keep it here so they can't drift again.
 */
export const LIFECYCLE_BADGE_VARIANT: Record<ClientLifecycle, StatusBadgeVariant> = {
  [ClientLifecycle.LEAD]: "secondary",
  [ClientLifecycle.PROSPECT]: "secondary",
  [ClientLifecycle.ACTIVE]: "success",
  [ClientLifecycle.PAUSED]: "warning",
  [ClientLifecycle.COMPLETED]: "success",
  [ClientLifecycle.LOST]: "destructive",
};

/**
 * Single source of truth for how a book's status reads as a Badge (Books
 * list, Book details header). Previously hand-duplicated in both places.
 */
export const BOOK_STATUS_BADGE_VARIANT: Record<BookStatus, StatusBadgeVariant> = {
  [BookStatus.DRAFT]: "secondary",
  [BookStatus.READY_FOR_REVIEW]: "warning",
  [BookStatus.PUBLISHED]: "success",
  [BookStatus.ARCHIVED]: "destructive",
};

/**
 * The hex each `StatusBadgeVariant` renders as outside a `Badge` itself —
 * e.g. a chart that needs to color-match the same status. Keep any such
 * consumer deriving from `*_BADGE_VARIANT` + this map rather than hand-listing
 * its own colors per enum value, so the two representations of the same
 * status can't drift apart the way the dashboard lifecycle chart's colors
 * once did.
 */
export const BADGE_VARIANT_HEX: Record<StatusBadgeVariant, string> = {
  secondary: "#94a3b8",
  success: "#10b981",
  warning: "#f59e0b",
  destructive: "#ef4444",
};
