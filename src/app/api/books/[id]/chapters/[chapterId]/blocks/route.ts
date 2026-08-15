import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { addBookBlock } from "src/server/books/blocks/handlers/add-book-block";
import { FindChapterBlocksParamsDto } from "src/server/books/blocks/dto/find-chapter-blocks-params.dto";

export const dynamic = "force-dynamic";

// No `body` — multipart-only (a block may carry an image).
export const POST = createPostRoute({
  params: FindChapterBlocksParamsDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ request, params }) => addBookBlock(request, params.id, { kind: "chapter", chapterId: params.chapterId }),
});
