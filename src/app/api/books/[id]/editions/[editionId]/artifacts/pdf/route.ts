import { NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import { authenticateRequest, authorizeUser, createErrorResponse, createPdfResponse, getNextBackendToolkitConfig } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import "reflect-metadata";
import "src/server/core/toolkit.config";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { BookArtifactType } from "src/server/books/artifacts/book-artifact.schema";
import { bookArtifactRepository } from "src/server/books/artifacts/book-artifacts.repository";
import { fetchPdfArtifactBytes } from "src/server/books/artifacts/book-artifact-storage";
import { resolveArtifactState } from "src/common/books/artifacts/resolve-artifact-state";
import { FindEditionParamsDto } from "src/server/books/editions/dto/find-edition-params.dto";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import { bookRepository } from "src/server/books/books.repository";

export const dynamic = "force-dynamic";

const AUTH_OPTION = { permissions: [AppPermission.BOOK_ARTIFACT.READ] };

/**
 * Streams the stored PDF bytes rather than ever returning the raw
 * Cloudinary URL in a JSON response — this is the one route that reads
 * `storageUrl`, matching the same "the client never gets a direct
 * storage link" convention `book-artifact-storage.ts` documents. A
 * binary response can't go through `createRoute` (see `print-preview`/
 * `recipes/export-pdf` for the same reasoning), so this composes the
 * same auth/error pieces by hand.
 *
 * Gated on `allowPdfDownload` — a doctor can disable downloads for a
 * book without touching any Edition/artifact. Both "download disabled"
 * and "no ready artifact" return 404 rather than a more specific status,
 * deliberately not distinguishing "exists but forbidden" from "doesn't
 * exist" to a caller who only has read access to begin with.
 */
export async function GET(request: NextRequest, context: { params: { id: string; editionId: string } }) {
  try {
    const config = getNextBackendToolkitConfig();
    await config.database.connect();

    const user = await authenticateRequest({ request, config, authOption: AUTH_OPTION });
    authorizeUser(user, AUTH_OPTION);

    const params = await validateDto(FindEditionParamsDto, context.params);

    const book = await bookRepository.findOne({ where: { _id: params.id } });
    if (!book.allowPdfDownload) {
      throw new NotFoundError("No downloadable PDF is available for this book.");
    }

    const edition = await bookEditionRepository.findOne({ where: { _id: params.editionId, bookId: params.id } });
    const artifact = await bookArtifactRepository.findOne({ where: { editionId: params.editionId, type: BookArtifactType.PDF }, skipThrowError: true });

    const state = artifact ? resolveArtifactState(artifact, artifact.templateVersion) : "NOT_GENERATED";
    if (state !== "READY" && state !== "OUTDATED") {
      throw new NotFoundError("No ready PDF is available for this edition yet.");
    }
    if (!artifact?.storageUrl) {
      throw new NotFoundError("No ready PDF is available for this edition yet.");
    }

    const pdf = await fetchPdfArtifactBytes(artifact.storageUrl);
    return createPdfResponse(pdf, { filename: `${edition.titleAtPublish || "book"}.pdf` });
  } catch (error) {
    return createErrorResponse(error);
  }
}
