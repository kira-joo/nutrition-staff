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
 */
export const BOOK_LIST_PROJECTION = {
  chapters: false,
  frontMatter: false,
  backMatter: false,
  references: false,
  overrides: false,
} as const;
