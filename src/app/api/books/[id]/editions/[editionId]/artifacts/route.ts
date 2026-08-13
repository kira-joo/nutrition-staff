import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { bookArtifactRepository } from "src/server/books/artifacts/book-artifacts.repository";
import { BookArtifactType } from "src/server/books/artifacts/book-artifact.schema";
import { generateBookArtifact } from "src/server/books/artifacts/generate-book-artifact";
import { FindEditionParamsDto } from "src/server/books/editions/dto/find-edition-params.dto";

export const dynamic = "force-dynamic";

// No body — publish is modelled as "create an Edition" already covers
// the identity of what to generate FROM; there is nothing else a client
// could legitimately vary about a PDF artifact request. Generation runs
// SYNCHRONOUSLY inside this request (see the Phase F report's S8/
// Vercel note) — the response IS the final READY|FAILED outcome, not a
// "started, poll GET for status" acknowledgement. `ConflictError` (409)
// means a generation for this exact edition is already in flight.
export const POST = createPostRoute({
  params: FindEditionParamsDto,
  auth: { permissions: [AppPermission.BOOK_ARTIFACT.CREATE] },
  handler: async ({ params, user }) => generateBookArtifact(params.id, params.editionId, String(user._id)),
});

// At most one row per (editionId, type) — see the compound unique index
// on `BookArtifactModel` — so this is "the" artifact for this edition,
// or `null` if generation was never attempted.
export const GET = createGetRoute({
  params: FindEditionParamsDto,
  auth: { permissions: [AppPermission.BOOK_ARTIFACT.READ] },
  handler: async ({ params }) => bookArtifactRepository.findOne({ where: { editionId: params.editionId, type: BookArtifactType.PDF }, skipThrowError: true }),
});
