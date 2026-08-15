import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { duplicateBookBlock } from "src/server/books/blocks/handlers/duplicate-book-block";
import { containerRefFromParams } from "src/server/books/blocks/resolve-block-container";
import { FindSectionBlockParamsDto } from "src/server/books/blocks/dto/find-section-blocks-params.dto";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";

export const dynamic = "force-dynamic";

export const POST = createPostRoute({
  params: FindSectionBlockParamsDto,
  body: ExpectedRevisionDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => duplicateBookBlock(params.id, containerRefFromParams(params), params.blockId, body.expectedRevision),
});
