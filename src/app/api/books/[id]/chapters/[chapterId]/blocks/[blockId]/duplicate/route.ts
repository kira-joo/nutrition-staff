import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { duplicateBookBlock } from "src/server/books/blocks/handlers/duplicate-book-block";
import { FindChapterBlockParamsDto } from "src/server/books/blocks/dto/find-chapter-blocks-params.dto";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";

export const dynamic = "force-dynamic";

export const POST = createPostRoute({
  params: FindChapterBlockParamsDto,
  body: ExpectedRevisionDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) =>
    duplicateBookBlock(params.id, { kind: "chapter", chapterId: params.chapterId }, params.blockId, body.expectedRevision),
});
