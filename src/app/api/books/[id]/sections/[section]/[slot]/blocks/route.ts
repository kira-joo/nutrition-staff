import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { addBookBlock } from "src/server/books/blocks/handlers/add-book-block";
import { containerRefFromParams } from "src/server/books/blocks/resolve-block-container";
import { FindSectionBlocksParamsDto } from "src/server/books/blocks/dto/find-section-blocks-params.dto";

export const dynamic = "force-dynamic";

// `section`/`slot` together identify one of the fixed front-matter/back-matter slots (see resolve-block-container.ts) — reuses the identical block registry/DTO dispatch/asset pipeline chapters use.
export const POST = createPostRoute({
  params: FindSectionBlocksParamsDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ request, params }) => addBookBlock(request, params.id, containerRefFromParams(params)),
});
