import { createGetRoute } from "src/server/core/route-factories";
import { findPublicBookListItems } from "src/server/books/public/find-public-book-list-items";
import { PublicListBooksQueryDto } from "src/server/books/public/dto/public-list-books-query.dto";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// same "backend complete" convention as every other module. Title/
// subtitle/coverImage are Edition-backed (see
// `find-public-book-list-items.ts`), never the live Book draft — a
// consistency requirement, not an optimization: without it, editing the
// draft toward a future Edition 2 could show new presentation data on
// the listing while the book's own detail page still renders Edition 1.
export const GET = createGetRoute({
  query: PublicListBooksQueryDto,
  auth: false,
  handler: async ({ query }) => findPublicBookListItems(query),
});
