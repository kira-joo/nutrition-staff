import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute } from "src/server/core/route-factories";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import { FindEditionParamsDto } from "src/server/books/editions/dto/find-edition-params.dto";

export const dynamic = "force-dynamic";

// No PUT, no DELETE — an Edition is write-once. There is deliberately no
// route at all that could mutate or remove a published Edition; the one
// exception (a rollback of an edition that was never actually published,
// because the Book's own pointers failed to advance) lives entirely
// inside publish-book-edition.ts, never exposed as an API route.
export const GET = createGetRoute({
  params: FindEditionParamsDto,
  auth: { permissions: [AppPermission.BOOK_EDITION.READ_ONE] },
  handler: async ({ params }) => bookEditionRepository.findOne({ where: { _id: params.editionId, bookId: params.id } }),
});
