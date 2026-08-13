import { SortOrder } from "@kira-joo/toolkit-common";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { bookDetailTags } from "src/server/core/revalidation/revalidate-entity";
import { publishBookEdition } from "src/server/books/publishing/publish-book-edition";
import { PublishBookDto } from "src/server/books/publishing/dto/publish-book.dto";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindBookParamsDto,
  auth: { permissions: [AppPermission.BOOK_EDITION.READ] },
  handler: async ({ params }) => bookEditionRepository.findAll({ where: { bookId: params.id }, sort: { field: "editionNumber", order: SortOrder.DESC } }),
});

// Publish is modelled as "create an Edition" — see the architecture plan's
// permission-modelling decision (a dedicated PUBLISH action would mint
// `<Entity>.publish` for every entity in the app, not just Book).
export const POST = createPostRoute({
  params: FindBookParamsDto,
  body: PublishBookDto,
  auth: { permissions: [AppPermission.BOOK_EDITION.CREATE] },
  handler: async ({ params, body, user }) => publishBookEdition(params.id, String(user._id), body),
  // A new current Edition (`currentEditionId`/`status`/`editionCount`)
  // directly changes the public reader payload — slug never changes here.
  revalidateTags: ({ result }) => bookDetailTags(result.book.slug),
});
