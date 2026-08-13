import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { removeBookBlock } from "src/server/books/blocks/handlers/remove-book-block";
import { replaceBookBlock } from "src/server/books/blocks/handlers/replace-book-block";
import { containerRefFromParams } from "src/server/books/blocks/resolve-block-container";
import { FindSectionBlockParamsDto } from "src/server/books/blocks/dto/find-section-blocks-params.dto";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";

export const dynamic = "force-dynamic";

// No `body` — multipart-only.
export const PUT = createPutRoute({
  params: FindSectionBlockParamsDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ request, params }) => replaceBookBlock(request, params.id, containerRefFromParams(params), params.blockId),
});

export const DELETE = createDeleteRoute({
  params: FindSectionBlockParamsDto,
  body: ExpectedRevisionDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => removeBookBlock(params.id, containerRefFromParams(params), params.blockId, body.expectedRevision),
});
