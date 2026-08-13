import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BookModel } from "src/server/books/book.schema";

export const bookRepository = createMongooseRepository({
  model: BookModel,
  entityName: EntityName.BOOK,
});

/**
 * Projects away the heavy content fields for list contexts — the books
 * table only ever needs the header/lifecycle fields, and shipping
 * chapters/frontMatter/backMatter/references/overrides on every row is
 * exactly the "40-image content tab loads 200MB" mistake this project's
 * own conventions warn against, just on the list page instead.
 *
 * `RepositorySelect` is an INCLUSION-only whitelist in this toolkit
 * (`buildLevelProjection` skips every `false`/`undefined` entry rather
 * than turning it into a Mongo exclusion `0`) — an all-`false` object
 * collapses to an empty `{}` projection, which MongoDB treats as "no
 * restriction at all." Caught live: the list route was silently serving
 * full documents, including `chapters`/`references`/`overrides`, despite
 * this constant's name and intent. Listed here as `true` instead, one
 * entry per field the books table actually renders.
 */
export const BOOK_LIST_PROJECTION = {
  title: true,
  subtitle: true,
  slug: true,
  shortDescription: true,
  category: true,
  editionLabelTemplate: true,
  coverImage: true,
  backCoverImage: true,
  status: true,
  visibility: true,
  allowFlipbook: true,
  allowPdfDownload: true,
  showOnWebsite: true,
  revision: true,
  contentRevision: true,
  currentEditionId: true,
  lastPublishedAt: true,
  editionCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * The public listing's own, deliberately narrower, allow-list — same
 * inclusion-only shape and the same "an all-`false` object is silently
 * treated as no restriction" trap `BOOK_LIST_PROJECTION`'s own comment
 * warns about. Excludes every staff/internal field `BOOK_LIST_PROJECTION`
 * carries (status, visibility, allowFlipbook, allowPdfDownload,
 * showOnWebsite, revision, contentRevision, currentEditionId,
 * editionLabelTemplate) — the public route's `where` clause already
 * guarantees every returned row is public, so none of those flags need
 * to reach the response, and `currentEditionId` is an internal pointer,
 * not public-facing data.
 */
export const PUBLIC_BOOK_LIST_PROJECTION = {
  title: true,
  subtitle: true,
  slug: true,
  shortDescription: true,
  category: true,
  coverImage: true,
  editionCount: true,
  lastPublishedAt: true,
} as const;

/**
 * The public DETAIL route's own minimal projection — only what
 * `buildPublicBookReaderPayload` actually reads off the live `Book`
 * (everything else the reader payload needs comes from the frozen
 * Edition). Excludes `chapters`/`frontMatter`/`backMatter`/`references`/
 * `overrides` entirely, so the live draft manuscript is never even
 * fetched into memory on this path, let alone returned.
 */
export const PUBLIC_BOOK_DETAIL_PROJECTION = {
  slug: true,
  shortDescription: true,
  category: true,
  allowFlipbook: true,
  allowPdfDownload: true,
  currentEditionId: true,
  status: true,
  showOnWebsite: true,
} as const;
