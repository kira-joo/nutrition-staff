import { NotFoundError } from "@kira-joo/backend-toolkit-core";
import { createGetRoute } from "src/server/core/route-factories";
import { BookStatus } from "src/common/enums";
import { PUBLIC_BOOK_DETAIL_PROJECTION, bookRepository } from "src/server/books/books.repository";
import { BookArtifactType } from "src/server/books/artifacts/book-artifact.schema";
import { bookArtifactRepository } from "src/server/books/artifacts/book-artifacts.repository";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import { buildPublicBookReaderPayload } from "src/server/books/public/build-public-book-reader-payload";
import { FindBookBySlugParamsDto } from "src/server/books/public/dto/find-book-by-slug-params.dto";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client.
// Deliberately does NOT require `visibility: PUBLIC` — that is exactly
// what lets an UNLISTED book resolve by direct URL while staying absent
// from the listing route's `where` clause. A Draft, Archived, or
// showOnWebsite:false book 404s exactly like a nonexistent slug, never
// leaking which one it is.
export const GET = createGetRoute({
  params: FindBookBySlugParamsDto,
  auth: false,
  handler: async ({ params }) => {
    const book = await bookRepository.findOne({
      where: { slug: params.slug, status: BookStatus.PUBLISHED, showOnWebsite: true },
      select: PUBLIC_BOOK_DETAIL_PROJECTION,
    });

    // `status: PUBLISHED` can only be reached via publish-book-edition.ts,
    // which always sets `currentEditionId` in the same write — this is a
    // defensive guard against that invariant ever drifting, not a case
    // expected to trigger in practice.
    if (!book.currentEditionId) {
      throw new NotFoundError("Book not found.");
    }

    const edition = await bookEditionRepository.findOne({ where: { _id: book.currentEditionId } });
    const artifact = await bookArtifactRepository.findOne({
      where: { editionId: edition._id, type: BookArtifactType.PDF },
      skipThrowError: true,
    });

    return buildPublicBookReaderPayload(book, edition, artifact);
  },
});
