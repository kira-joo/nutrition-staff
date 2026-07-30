import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { findIncompleteLocalizedPaths } from "@kira-joo/toolkit-common";
import { ContentStatus } from "src/common/enums";

/**
 * Platform-wide publishing rule: while an entity is Draft, incomplete
 * translations are fine — but once its `status` is (or is being changed
 * to) Published, every localized field that's actually present must have
 * both Arabic and English content. Only fields intentionally non-localized
 * by design (URLs, IDs, numbers, images, etc.) are exempt, since
 * `findIncompleteLocalizedPaths` only ever looks at `{ar, en}`-shaped
 * values in the first place.
 *
 * Pass the *would-be* saved state (the existing document merged with
 * whatever patch is about to be applied, including any nested
 * arrays/blocks) — not just the incoming DTO — so this catches an update
 * that would leave an already-published entity's now-changed content
 * incomplete, not only a fresh draft-to-published transition.
 *
 * @throws {BadRequestError} with `details.incompletePaths` (dot-paths, e.g. `"blocks.0.heading"`) when `status` is Published and something is incomplete.
 */
export function assertPublishReady(entity: unknown, status: ContentStatus): void {
  if (status !== ContentStatus.PUBLISHED) return;

  const incompletePaths = findIncompleteLocalizedPaths(entity);
  if (incompletePaths.length > 0) {
    throw new BadRequestError(
      "Cannot publish: the following fields are missing a translation.",
      { incompletePaths }
    );
  }
}
