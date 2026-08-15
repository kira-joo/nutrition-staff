import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { BookStatus, BookVisibility } from "src/common/enums";
import { CreateBookDto } from "src/server/books/dto/create-book.dto";
import { ListBooksQueryDto } from "src/server/books/dto/list-books-query.dto";
import { BOOK_LIST_PROJECTION, bookRepository } from "src/server/books/books.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListBooksQueryDto,
  auth: { permissions: [AppPermission.BOOK.READ] },
  handler: async ({ query }) => bookRepository.findAllAndCountPublic({ query, select: BOOK_LIST_PROJECTION }),
});

// Plain JSON — a Book is always created empty (no assets on create), then
// filled in through its own editor. Always DRAFT/UNLISTED regardless of
// what the client sends, since nothing is authored yet.
export const POST = createPostRoute({
  body: CreateBookDto,
  auth: { permissions: [AppPermission.BOOK.CREATE] },
  handler: async ({ body }) =>
    bookRepository.save({
      ...body,
      status: BookStatus.DRAFT,
      visibility: BookVisibility.UNLISTED,
      showOnWebsite: false,
      allowFlipbook: true,
      allowPdfDownload: true,
    }),
});
