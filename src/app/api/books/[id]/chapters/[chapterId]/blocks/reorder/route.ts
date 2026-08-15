import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPutRoute } from "src/server/core/route-factories";
import { reorderBookBlocks } from "src/server/books/blocks/handlers/reorder-book-blocks";
import { FindChapterBlocksParamsDto } from "src/server/books/blocks/dto/find-chapter-blocks-params.dto";
import { ReorderBookBlocksDto } from "src/server/books/blocks/dto/reorder-book-blocks.dto";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  params: FindChapterBlocksParamsDto,
  body: ReorderBookBlocksDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) =>
    reorderBookBlocks(params.id, { kind: "chapter", chapterId: params.chapterId }, body.blockIds, body.expectedRevision),
});
