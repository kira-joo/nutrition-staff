import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute } from "src/server/core/route-factories";
import { checkBookPublishReadiness } from "src/server/books/publishing/check-book-publish-readiness";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";

export const dynamic = "force-dynamic";

/** Dry-run only — never writes anything, never creates an Edition. */
export const GET = createGetRoute({
  params: FindBookParamsDto,
  auth: { permissions: [AppPermission.BOOK.READ] },
  handler: async ({ params }) => checkBookPublishReadiness(params.id),
});
