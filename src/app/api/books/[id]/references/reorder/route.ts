import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPutRoute } from "src/server/core/route-factories";
import { reorderBookReferences } from "src/server/books/references/handlers/reorder-book-references";
import { ReorderBookReferencesDto } from "src/server/books/references/dto/reorder-book-references.dto";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  params: FindBookParamsDto,
  body: ReorderBookReferencesDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => reorderBookReferences(params.id, body.referenceIds, body.expectedRevision),
});
