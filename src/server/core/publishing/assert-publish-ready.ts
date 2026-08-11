import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { findIncompleteLocalizedPaths } from "@kira-joo/toolkit-common";
import { ContentStatus } from "src/common/enums";

/**
 * Platform-wide publishing rule: while an entity is Draft, incomplete
 * translations are fine — but once its `status` is (or is being changed
 * to) Published:
 * - a *required* localized field must have both Arabic and English content;
 * - an *optional* localized field may be left fully blank, but the moment
 *   it's been started in any one locale, it must be completed in every
 *   locale too — a half-translated optional field still blocks Publish.
 *
 * Only fields intentionally non-localized by design (URLs, IDs, numbers,
 * images, etc.) are exempt, since `findIncompleteLocalizedPaths` only ever
 * looks at `{ar, en}`-shaped values in the first place.
 *
 * `isRequired` decides which rule applies to a given dot-path — build it
 * with `createDtoRequirednessResolver(CreateDto, entity)`
 * (`@kira-joo/backend-toolkit-core`), which reads the entity's own
 * create-time DTO decorators (`@IsOptional()`) rather than a second,
 * separately maintained list of required fields. Always pass the
 * **create** DTO, never the update DTO — an update DTO conventionally
 * marks every field `@IsOptional()` for partial-update purposes, which
 * would make every field here look optional.
 *
 * Pass the *would-be* saved state (the existing document merged with
 * whatever patch is about to be applied, including any nested
 * arrays/blocks) — not just the incoming DTO — so this catches an update
 * that would leave an already-published entity's now-changed content
 * incomplete, not only a fresh draft-to-published transition.
 *
 * @throws {BadRequestError} with `details.incompletePaths` (dot-paths, e.g. `"blocks.0.heading"`) when `status` is Published and something is incomplete.
 */
export function assertPublishReady(
  entity: unknown,
  status: ContentStatus,
  isRequired: (path: string) => boolean
): void {
  if (status !== ContentStatus.PUBLISHED) return;

  const incompletePaths = findIncompleteLocalizedPaths(entity, { isRequired });
  if (incompletePaths.length > 0) {
    throw new BadRequestError(
      "Cannot publish: the following fields are missing a translation.",
      { incompletePaths }
    );
  }
}
