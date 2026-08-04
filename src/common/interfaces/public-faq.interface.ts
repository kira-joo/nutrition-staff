import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";

/**
 * The public website's FAQ shape — sections with their items already
 * joined, ordered, and filtered to published-only, server-side. Narrower
 * than {@link FaqSection}/{@link FaqItem} (the admin CRUD shapes): no
 * `order` (already applied), no `status`/`createdAt`/`updatedAt` (nothing
 * the public site renders) — only what a visitor-facing FAQ page needs.
 */
export interface PublicFaqItem {
  _id: string;
  question: LocalizedString;
  answer: LocalizedString;
}

export interface PublicFaqSection {
  _id: string;
  title: LocalizedString;
  items: PublicFaqItem[];
}
