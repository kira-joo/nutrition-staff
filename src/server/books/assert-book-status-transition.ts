import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { BookStatus } from "src/common/enums";

/**
 * `PUBLISHED` is reachable only through the (Phase E) publish route, never
 * this header-update path — editing a Draft must never mutate an already-
 * published Edition, and letting a plain status PUT set `PUBLISHED`
 * without running publish validation/snapshotting would defeat that.
 */
const ALLOWED_TRANSITIONS: Record<BookStatus, readonly BookStatus[]> = {
  [BookStatus.DRAFT]: [BookStatus.READY_FOR_REVIEW],
  [BookStatus.READY_FOR_REVIEW]: [BookStatus.DRAFT],
  [BookStatus.PUBLISHED]: [BookStatus.ARCHIVED, BookStatus.DRAFT],
  [BookStatus.ARCHIVED]: [BookStatus.DRAFT],
};

export function assertBookStatusTransition(current: BookStatus, next: BookStatus): void {
  if (current === next) return;

  if (next === BookStatus.PUBLISHED) {
    throw new BadRequestError("A book can only be published through the publish action, not by editing its status directly.");
  }

  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new BadRequestError(`Cannot move a book from "${current}" to "${next}".`);
  }
}
