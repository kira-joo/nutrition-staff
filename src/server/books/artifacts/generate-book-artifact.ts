import { ConflictError, DuplicateKeyError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import { renderBookPdf } from "src/server/books/render/render-book-pdf";
import { destroyPdfArtifactBestEffort, uploadPdfArtifact } from "./book-artifact-storage";
import { BookArtifactStatus, BookArtifactType, type BookArtifactSchema } from "./book-artifact.schema";
import { bookArtifactRepository } from "./book-artifacts.repository";
import { resolveArtifactState } from "src/common/books/artifacts/resolve-artifact-state";

/**
 * Generate (or regenerate) the PDF artifact for one Edition — reads
 * ONLY `edition.content`/`edition.resolvedSettings`/`edition.
 * templateVersion` (via `renderBookPdf`), never the live Book/
 * BookSettings/Recipe data, so the output is reproducible from the
 * immutable Edition alone.
 *
 * Concurrency: at most one `BookArtifact` row exists per
 * `(editionId, type)` (a compound unique index — see
 * `book-artifact.schema.ts`). The FIRST-ever generation for an edition
 * races on `.save()`; losing that race throws `DuplicateKeyError`,
 * treated as "someone else already started," not an error. Every later
 * (re)generation instead atomically flips the EXISTING row from a
 * non-`GENERATING` state to `GENERATING` via `.update()`'s own `where`
 * clause — if a concurrent request already made that flip, this update
 * matches nothing and throws `NotFoundError`, treated the same way.
 * Either path means two overlapping "Generate" clicks can never both
 * proceed to render a competing PDF for the same edition.
 */
export async function generateBookArtifact(bookId: string, editionId: string, generatedByUserId: string): Promise<BookArtifactSchema> {
  const edition = await bookEditionRepository.findOne({ where: { _id: editionId, bookId } });

  const existing = await bookArtifactRepository.findOne({ where: { editionId, type: BookArtifactType.PDF }, skipThrowError: true });
  const row = existing ? await claimExistingRow(existing) : await claimNewRow(bookId, editionId, edition.templateVersion, generatedByUserId);
  if (!row) {
    throw new ConflictError("A PDF generation for this edition is already in progress.");
  }

  let rendered;
  try {
    rendered = await renderBookPdf({ content: edition.content, resolvedSettings: edition.resolvedSettings, templateVersion: edition.templateVersion, recipeSnapshots: edition.recipeSnapshots });
  } catch (error) {
    await markFailed(row._id.toString(), error);
    throw error;
  }

  if (rendered.warnings.length > 0) {
    console.warn(`generateBookArtifact: edition ${editionId} produced ${rendered.warnings.length} pagination warning(s):`, rendered.warnings);
  }

  let uploaded;
  try {
    uploaded = await uploadPdfArtifact(rendered.pdf, `edition-${editionId}`);
  } catch (error) {
    await markFailed(row._id.toString(), error);
    throw error;
  }

  try {
    return await bookArtifactRepository.update(
      { where: { _id: row._id } },
      {
        status: BookArtifactStatus.READY,
        finishedAt: new Date(),
        pageCount: rendered.pageCount,
        fileSize: uploaded.bytes,
        storageProvider: "cloudinary",
        storagePublicId: uploaded.publicId,
        storageUrl: uploaded.url,
        errorMessage: null,
      } as unknown as Partial<BookArtifactSchema>
    );
  } catch (error) {
    // The render + upload succeeded but persisting that fact failed —
    // the uploaded PDF is now orphaned (no row points at it), so clean
    // it up rather than leaking a raw Cloudinary asset nothing
    // references.
    await destroyPdfArtifactBestEffort(uploaded.publicId, `edition ${editionId}: READY persist failed`);
    await markFailed(row._id.toString(), error);
    throw error;
  }
}

async function claimNewRow(bookId: string, editionId: string, templateVersion: string, generatedByUserId: string): Promise<BookArtifactSchema | null> {
  try {
    return await bookArtifactRepository.save({
      editionId,
      bookId,
      type: BookArtifactType.PDF,
      status: BookArtifactStatus.GENERATING,
      templateVersion,
      startedAt: new Date(),
      generatedByUserId,
    } as unknown as Partial<BookArtifactSchema>);
  } catch (error) {
    if (error instanceof DuplicateKeyError) return null; // lost the race — another request just created the row first
    throw error;
  }
}

async function claimExistingRow(existing: BookArtifactSchema): Promise<BookArtifactSchema | null> {
  const state = resolveArtifactState(existing, existing.templateVersion);
  if (state === "GENERATING") return null; // a real, non-stale generation is already in flight

  try {
    // Deliberately does NOT clear `storageUrl`/`storagePublicId`/
    // `pageCount`/`fileSize` here — caught live: doing so optimistically
    // destroyed the pointer to the last GOOD PDF the instant a
    // regeneration was requested, so a regeneration that then failed
    // left the row with neither the old nor a new artifact. The upload
    // step uses a deterministic publicId with `overwrite: true` (see
    // `uploadPdfArtifact`), so a SUCCESSFUL regeneration naturally
    // replaces the old Cloudinary asset and these fields together; a
    // FAILED one now just leaves the previous READY data in place
    // (still correctly hidden from `resolveArtifactState`/the download
    // route, since `status` itself is what they key off).
    return await bookArtifactRepository.update(
      { where: { _id: existing._id, status: { $ne: BookArtifactStatus.GENERATING } } },
      {
        status: BookArtifactStatus.GENERATING,
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      } as unknown as Partial<BookArtifactSchema>
    );
  } catch (error) {
    if (error instanceof NotFoundError) return null; // someone else flipped it to GENERATING first
    throw error;
  }
}

/** Not every thrown value is a real `Error` instance — caught live: the Cloudinary SDK rejects with a plain `{message, name, http_code}` object, which `instanceof Error` misses, so the old `String(error)` fallback persisted the literal text "[object Object]" as the error message. */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) return String((error as { message: unknown }).message);
  return String(error);
}

async function markFailed(artifactId: string, error: unknown): Promise<void> {
  const errorMessage = describeError(error);
  try {
    await bookArtifactRepository.update({ where: { _id: artifactId } }, { status: BookArtifactStatus.FAILED, finishedAt: new Date(), errorMessage } as unknown as Partial<BookArtifactSchema>);
  } catch (updateError) {
    console.error(`generateBookArtifact: failed to persist FAILED status for artifact ${artifactId} (original error: ${errorMessage}).`, updateError);
  }
}
