import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { removeBookReference } from "src/server/books/references/handlers/remove-book-reference";
import { updateBookReference } from "src/server/books/references/handlers/update-book-reference";
import { UpdateBookReferenceDto } from "src/server/books/references/dto/book-reference.dto";
import { FindReferenceParamsDto } from "src/server/books/references/dto/find-reference-params.dto";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  params: FindReferenceParamsDto,
  body: UpdateBookReferenceDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => updateBookReference(params.id, params.referenceId, body),
});

export const DELETE = createDeleteRoute({
  params: FindReferenceParamsDto,
  body: ExpectedRevisionDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => removeBookReference(params.id, params.referenceId, body.expectedRevision),
});
