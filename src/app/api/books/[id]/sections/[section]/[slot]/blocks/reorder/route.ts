import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPutRoute } from "src/server/core/route-factories";
import { reorderBookBlocks } from "src/server/books/blocks/handlers/reorder-book-blocks";
import { containerRefFromParams } from "src/server/books/blocks/resolve-block-container";
import { FindSectionBlocksParamsDto } from "src/server/books/blocks/dto/find-section-blocks-params.dto";
import { ReorderBookBlocksDto } from "src/server/books/blocks/dto/reorder-book-blocks.dto";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  params: FindSectionBlocksParamsDto,
  body: ReorderBookBlocksDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => reorderBookBlocks(params.id, containerRefFromParams(params), body.blockIds, body.expectedRevision),
});
