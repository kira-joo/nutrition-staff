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
