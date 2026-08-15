import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { addBookReference } from "src/server/books/references/handlers/add-book-reference";
import { CreateBookReferenceDto } from "src/server/books/references/dto/book-reference.dto";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";

export const dynamic = "force-dynamic";

// Plain JSON — references carry no assets.
export const POST = createPostRoute({
  params: FindBookParamsDto,
  body: CreateBookReferenceDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => addBookReference(params.id, body),
});
