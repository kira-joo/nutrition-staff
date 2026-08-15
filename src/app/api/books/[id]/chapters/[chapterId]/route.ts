import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { removeChapter } from "src/server/books/chapters/handlers/remove-chapter";
import { updateChapter } from "src/server/books/chapters/handlers/update-chapter";
import { FindChapterParamsDto } from "src/server/books/chapters/dto/find-chapter-params.dto";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";

export const dynamic = "force-dynamic";

// No `body` — multipart-only (a chapter may carry a cover image).
export const PUT = createPutRoute({
  params: FindChapterParamsDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ request, params }) => updateChapter(request, params.id, params.chapterId),
});

export const DELETE = createDeleteRoute({
  params: FindChapterParamsDto,
  body: ExpectedRevisionDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => removeChapter(params.id, params.chapterId, body.expectedRevision),
});
