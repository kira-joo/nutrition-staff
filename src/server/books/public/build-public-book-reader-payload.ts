import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import { resolveArtifactState } from "src/common/books/artifacts/resolve-artifact-state";
import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";
import type { BookBackMatter, BookFrontMatter, BookReference, Chapter } from "src/common/interfaces/book-chapter.interface";
import type { BookArtifactSchema } from "src/server/books/artifacts/book-artifact.schema";
import type { BookSchema } from "src/server/books/book.schema";
import type { BookEditionSchema, RecipeSnapshot } from "src/server/books/editions/book-edition.schema";

/** Everything from `ResolvedBookIdentity` EXCEPT `sources` — the override/default/unset provenance trail is a staff-authoring concern (drives the overrides UI's badges), never public-facing data. */
export type PublicResolvedIdentity = Omit<ResolvedBookIdentity, "sources">;

export interface PublicBookReaderPayload {
  /** Live, not frozen — this IS the routing/addressing key, so it must always reflect the book's current URL, never a stale one from publish time. */
  slug: string;
  /** Live Book fields — catalog metadata, not manuscript content, so they're safe to keep current without requiring a republish. */
  shortDescription?: string;
  category?: string;

  // Everything below is frozen at the current published Edition — never
  // re-resolved from the live Book/BookSettings/Recipe collections, per
  // BOOK_PLAN's "public reading resolves from the immutable Edition."
  title: string;
  subtitle?: string;
  coverImage: ImageAsset | null;
  backCoverImage: ImageAsset | null;
  resolvedSettings: PublicResolvedIdentity;
  content: {
    frontMatter: BookFrontMatter;
    chapters: Chapter[];
    backMatter: BookBackMatter;
    references: BookReference[];
  };
  recipeSnapshots: Record<string, RecipeSnapshot>;
  templateVersion: string;
  editionNumber: number;
  editionLabel?: string;
  publishedAt: string;

  /** What the public UI is allowed to offer — a straight passthrough of the live Book's own flags, since disabling flipbook/download for a book must take effect immediately without a republish. */
  allowFlipbook: boolean;
  pdf: {
    downloadAllowed: boolean;
    ready: boolean;
    pageCount?: number;
  };
}

/**
 * Projects `{book, edition, artifact}` into the one payload the public
 * reader/flipbook actually needs — deliberately excludes everything
 * listed in the Phase G plan as internal: `revision`/`contentRevision`,
 * `resolvedSettings.sources`, any validation/publish-check internals,
 * `notes`, unpublished content, and any artifact field beyond "is it
 * ready" (`errorMessage`, `storageUrl`, `storagePublicId`, `startedAt`/
 * `finishedAt`, `generatedByUserId`).
 */
export function buildPublicBookReaderPayload(book: BookSchema, edition: BookEditionSchema, artifact: BookArtifactSchema | null): PublicBookReaderPayload {
  const { sources: _sources, ...publicResolvedSettings } = edition.resolvedSettings;

  const artifactState = resolveArtifactState(artifact, edition.templateVersion);
  const pdfReady = artifactState === "READY" || artifactState === "OUTDATED";

  return {
    slug: book.slug,
    shortDescription: book.shortDescription,
    category: book.category,

    title: edition.content.title,
    subtitle: edition.content.subtitle,
    coverImage: edition.content.coverImage ?? null,
    backCoverImage: edition.content.backCoverImage ?? null,
    resolvedSettings: publicResolvedSettings,
    content: {
      frontMatter: edition.content.frontMatter,
      chapters: edition.content.chapters,
      backMatter: edition.content.backMatter,
      references: edition.content.references,
    },
    recipeSnapshots: edition.recipeSnapshots,
    templateVersion: edition.templateVersion,
    editionNumber: edition.editionNumber,
    editionLabel: edition.editionLabel,
    publishedAt: edition.publishedAt.toISOString(),

    allowFlipbook: book.allowFlipbook,
    pdf: {
      downloadAllowed: book.allowPdfDownload,
      ready: pdfReady,
      pageCount: pdfReady ? artifact?.pageCount : undefined,
    },
  };
}
