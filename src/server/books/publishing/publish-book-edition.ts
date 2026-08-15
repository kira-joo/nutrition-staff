import { BadRequestError, ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { BookStatus } from "src/common/enums";
import { resolveBookIdentity } from "src/common/books/resolve-book-identity";
import { bookSettingsRepository } from "src/server/book-settings/book-settings.repository";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { bookRepository } from "src/server/books/books.repository";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import { buildEditionLabel } from "./build-edition-label";
import { collectAssetPublicIds } from "./collect-asset-public-ids";
import type { PublishBookDto } from "./dto/publish-book.dto";
import { freezeBookContent } from "./freeze-book-content";
import { snapshotRecipeReferences } from "./snapshot-recipe-references";
import { validateBookForPublish } from "./validate-book-for-publish";

// PUBLISHED is a legitimate SOURCE state, not just a destination — a
// book's mutable Book/chapter/block/settings data is a separate, ongoing
// draft from whichever Edition `currentEditionId` currently points the
// public site at (see `[slug]/route.ts`), so publishing again while
// already PUBLISHED must freeze that draft into a NEW Edition and simply
// move `currentEditionId` forward — it must never be blocked, and must
// never touch the Edition it's replacing. Caught live: excluding
// PUBLISHED here made a book's first publish permanent — there was no
// way back into this action at all afterward, since nothing in the Staff
// UI could move status back to Draft either (a real dead end, not a
// deliberate one). ARCHIVED stays excluded on purpose: un-archiving is
// its own explicit, separate action (ARCHIVED -> DRAFT), not something a
// publish attempt should silently do on a book's behalf.
const PUBLISHABLE_STATUSES: readonly BookStatus[] = [BookStatus.DRAFT, BookStatus.READY_FOR_REVIEW, BookStatus.PUBLISHED];

/**
 * Publish, in order (matches the approved architecture):
 * load → validate (errors block, warnings need acknowledgement) →
 * resolve identity → snapshot recipes → freeze content → collect
 * referenced asset ids → create the Edition → advance the Book's
 * publication pointers under BOTH revision counters. `validateDto`
 * already ran on the raw payload before this is called (see the route).
 */
export async function publishBookEdition(bookId: string, publishedByUserId: string, dto: PublishBookDto) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });

  if (!PUBLISHABLE_STATUSES.includes(book.status)) {
    throw new BadRequestError(`Cannot publish a book with status "${book.status}" — archive it back to Draft first.`);
  }

  const settings = await getOrCreateSingleton(bookSettingsRepository, {});
  const identity = resolveBookIdentity(settings as unknown as Parameters<typeof resolveBookIdentity>[0], book);

  const { errors, warnings } = await validateBookForPublish(book, identity);
  if (errors.length > 0) {
    throw new BadRequestError("This book cannot be published until the following issues are resolved.", { errors });
  }

  const acknowledged = new Set(dto.acknowledgedWarningCodes ?? []);
  const unacknowledgedWarnings = warnings.filter((warning) => !acknowledged.has(warning.code));
  if (unacknowledgedWarnings.length > 0) {
    throw new BadRequestError("This book has warnings that must be acknowledged before publishing.", {
      warnings: unacknowledgedWarnings,
      requiresAcknowledgement: true,
    });
  }

  const content = freezeBookContent(book);
  const recipeSnapshots = await snapshotRecipeReferences(content);
  const referencedAssetPublicIds = collectAssetPublicIds({
    coverImage: book.coverImage,
    backCoverImage: book.backCoverImage,
    content,
    resolvedSettings: identity,
    recipeSnapshots,
  });

  const editionNumber = book.editionCount + 1;
  const publishedAt = new Date();

  const edition = await bookEditionRepository.save({
    bookId: book._id,
    editionNumber,
    editionLabel: buildEditionLabel(book.editionLabelTemplate, editionNumber),
    templateVersion: identity.templateVersion,
    contentRevision: book.contentRevision,
    publishedAt,
    publishedByUserId,
    slugAtPublish: book.slug,
    titleAtPublish: book.title,
    subtitleAtPublish: book.subtitle,
    coverImageAtPublish: book.coverImage ?? null,
    notes: dto.notes,
    content,
    resolvedSettings: identity,
    recipeSnapshots,
    referencedAssetPublicIds,
  });

  try {
    const updatedBook = await bookRepository.update(
      { where: { _id: bookId, revision: dto.expectedRevision, contentRevision: dto.expectedContentRevision } },
      {
        status: BookStatus.PUBLISHED,
        currentEditionId: edition._id,
        lastPublishedAt: publishedAt,
        editionCount: editionNumber,
        revision: dto.expectedRevision + 1,
      }
    );
    return { book: updatedBook, edition };
  } catch (error) {
    if (error instanceof NotFoundError) {
      // The Edition row was already written above but the Book's own
      // publication pointers never advanced — this Edition was never
      // actually published, so it must not linger as a phantom entry in
      // the doctor's edition history. This is the one deliberate
      // exception to "Editions are never deleted": the invariant that
      // rule protects is "a PUBLISHED edition is immutable," and this
      // row was never published in the first place.
      await bookEditionRepository.delete({ where: { _id: edition._id } });
      throw new ConflictError("This book was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }
}
