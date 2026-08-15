import { NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import { createErrorResponse, createPdfResponse, getNextBackendToolkitConfig } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import "reflect-metadata";
import "src/server/core/toolkit.config";
import { BookStatus } from "src/common/enums";
import { resolveArtifactState } from "src/common/books/artifacts/resolve-artifact-state";
import { fetchPdfArtifactBytes } from "src/server/books/artifacts/book-artifact-storage";
import { BookArtifactType } from "src/server/books/artifacts/book-artifact.schema";
import { bookArtifactRepository } from "src/server/books/artifacts/book-artifacts.repository";
import { PUBLIC_BOOK_DETAIL_PROJECTION, bookRepository } from "src/server/books/books.repository";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import { FindBookBySlugParamsDto } from "src/server/books/public/dto/find-book-by-slug-params.dto";

export const dynamic = "force-dynamic";

/**
 * The PUBLIC PDF delivery boundary — unauthenticated, unlike
 * `/api/books/[id]/editions/[editionId]/artifacts/pdf` (that route
 * requires a staff bearer token via `BOOK_ARTIFACT.READ` and is the
 * STAFF download path only; it is not reachable by an anonymous
 * nutrition-client visitor, so it cannot serve this role).
 *
 * Gating deliberately mirrors `/api/public/books/[slug]` exactly —
 * `status: PUBLISHED` + `showOnWebsite: true`, no `visibility: PUBLIC`
 * requirement, so an UNLISTED book's direct link can still download its
 * PDF — plus `allowPdfDownload` and a READY (or OUTDATED — see
 * `resolveArtifactState`; the reader payload's own `pdf.ready` flag
 * already treats the two the same, so this route must too, or a client
 * could see `ready: true` and then get a 404 here) artifact for the
 * CURRENT edition. Never triggers generation — a book with no artifact
 * yet just 404s, exactly like a book with no PDF permission at all, by
 * design (never distinguishing "exists but forbidden" from "doesn't
 * exist" to an unauthenticated caller).
 *
 * Streams bytes server-side via the same `fetchPdfArtifactBytes` +
 * `createPdfResponse` pair the staff route uses — `storageUrl`/
 * `storagePublicId` are read here and nowhere else in the response.
 */
export async function GET(request: NextRequest, context: { params: { slug: string } }) {
  try {
    const config = getNextBackendToolkitConfig();
    await config.database.connect();

    const params = await validateDto(FindBookBySlugParamsDto, context.params);

    const book = await bookRepository.findOne({
      where: { slug: params.slug, status: BookStatus.PUBLISHED, showOnWebsite: true },
      select: PUBLIC_BOOK_DETAIL_PROJECTION,
    });

    if (!book.allowPdfDownload || !book.currentEditionId) {
      throw new NotFoundError("No downloadable PDF is available for this book.");
    }

    const edition = await bookEditionRepository.findOne({ where: { _id: book.currentEditionId } });
    const artifact = await bookArtifactRepository.findOne({ where: { editionId: edition._id, type: BookArtifactType.PDF }, skipThrowError: true });

    const state = artifact ? resolveArtifactState(artifact, artifact.templateVersion) : "NOT_GENERATED";
    if ((state !== "READY" && state !== "OUTDATED") || !artifact?.storageUrl) {
      throw new NotFoundError("No ready PDF is available for this book yet.");
    }

    const pdf = await fetchPdfArtifactBytes(artifact.storageUrl);
    return createPdfResponse(pdf, { filename: `${edition.titleAtPublish || "book"}.pdf` });
  } catch (error) {
    return createErrorResponse(error);
  }
}
