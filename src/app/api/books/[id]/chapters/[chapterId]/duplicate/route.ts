import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { duplicateChapter } from "src/server/books/chapters/handlers/duplicate-chapter";
import { FindChapterParamsDto } from "src/server/books/chapters/dto/find-chapter-params.dto";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";

export const dynamic = "force-dynamic";

export const POST = createPostRoute({
  params: FindChapterParamsDto,
  body: ExpectedRevisionDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => duplicateChapter(params.id, params.chapterId, body.expectedRevision),
});
