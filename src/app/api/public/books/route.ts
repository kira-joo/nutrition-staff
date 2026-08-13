import { createGetRoute } from "src/server/core/route-factories";
import { BookStatus, BookVisibility } from "src/common/enums";
import { PUBLIC_BOOK_LIST_PROJECTION, bookRepository } from "src/server/books/books.repository";
import { PublicListBooksQueryDto } from "src/server/books/public/dto/public-list-books-query.dto";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// same "backend complete" convention as every other module. Hardcodes
// the full public-listing gate in `where`: PUBLISHED (so a book with no
// current Edition can never appear — status can't reach PUBLISHED
// without one), PUBLIC visibility (UNLISTED books resolve only by direct
// slug — see the `[slug]` route), and showOnWebsite. `select` is the
// narrow PUBLIC allow-list, never the staff `BOOK_LIST_PROJECTION`.
export const GET = createGetRoute({
  query: PublicListBooksQueryDto,
  auth: false,
  handler: async ({ query }) =>
    bookRepository.findAllAndCountPublic({
      query,
      where: { status: BookStatus.PUBLISHED, visibility: BookVisibility.PUBLIC, showOnWebsite: true },
      select: PUBLIC_BOOK_LIST_PROJECTION,
    }),
});
