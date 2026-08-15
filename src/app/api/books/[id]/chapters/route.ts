import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { addChapter } from "src/server/books/chapters/handlers/add-chapter";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";

export const dynamic = "force-dynamic";

// No `body` — multipart-only, same convention as any asset-bearing route (a chapter may carry a cover image).
export const POST = createPostRoute({
  params: FindBookParamsDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ request, params }) => addChapter(request, params.id),
});
