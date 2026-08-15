import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPutRoute } from "src/server/core/route-factories";
import { reorderChapters } from "src/server/books/chapters/handlers/reorder-chapters";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";
import { ReorderChaptersDto } from "src/server/books/chapters/dto/reorder-chapters.dto";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  params: FindBookParamsDto,
  body: ReorderChaptersDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => reorderChapters(params.id, body.chapterIds, body.expectedRevision),
});
