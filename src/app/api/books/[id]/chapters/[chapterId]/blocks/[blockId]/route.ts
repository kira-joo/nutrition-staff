import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { removeBookBlock } from "src/server/books/blocks/handlers/remove-book-block";
import { replaceBookBlock } from "src/server/books/blocks/handlers/replace-book-block";
import { FindChapterBlockParamsDto } from "src/server/books/blocks/dto/find-chapter-blocks-params.dto";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";

export const dynamic = "force-dynamic";

// No `body` — multipart-only.
export const PUT = createPutRoute({
  params: FindChapterBlockParamsDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ request, params }) => replaceBookBlock(request, params.id, { kind: "chapter", chapterId: params.chapterId }, params.blockId),
});

export const DELETE = createDeleteRoute({
  params: FindChapterBlockParamsDto,
  body: ExpectedRevisionDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) =>
    removeBookBlock(params.id, { kind: "chapter", chapterId: params.chapterId }, params.blockId, body.expectedRevision),
});
