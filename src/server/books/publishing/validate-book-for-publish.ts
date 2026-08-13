import { BookBlockType, ContentStatus } from "src/common/enums";
import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { BookSchema } from "src/server/books/book.schema";
import { recipeRepository } from "src/server/recipes/recipes.repository";

export interface PublishValidationIssue {
  code: string;
  message: string;
}

export interface PublishValidationResult {
  errors: PublishValidationIssue[];
  warnings: PublishValidationIssue[];
}

/** Rough proxy for print-quality — an approximation stated plainly, not a real DPI-at-rendered-size calculation (that needs the resolved print geometry, Phase F territory). Below this, an image will look visibly soft at A5 print size. */
const LOW_RESOLUTION_WIDTH_PX = 800;

/**
 * BOOK_PLAN §27's checklist, scoped deliberately narrow — "do not turn
 * every aesthetic preference into a blocking validation." Errors block
 * publishing outright; warnings publish once every warning `code` is
 * present in `acknowledgedWarningCodes` (see `publish-book-edition.ts`).
 * Malformed external links are NOT re-checked here — the rich-text
 * allow-list validator and each block DTO's own `@IsUrl` already reject
 * unsafe/malformed URLs at write time, so there is nothing left to catch
 * at publish time.
 */
export async function validateBookForPublish(book: BookSchema, identity: ResolvedBookIdentity): Promise<PublishValidationResult> {
  const errors: PublishValidationIssue[] = [];
  const warnings: PublishValidationIssue[] = [];

  if (!book.title?.trim()) {
    errors.push({ code: "MISSING_TITLE", message: "The book has no title." });
  }
  if (!book.coverImage) {
    errors.push({ code: "MISSING_COVER", message: "The book has no cover image." });
  }
  if (book.chapters.length === 0) {
    errors.push({ code: "NO_CHAPTERS", message: "The book has no chapters." });
  }

  for (const chapter of book.chapters) {
    if ((chapter.blocks?.length ?? 0) === 0) {
      errors.push({ code: "EMPTY_CHAPTER", message: `Chapter "${chapter.title}" has no content blocks.` });
    }
  }

  const frontMatterSections: [string, { blocks: BookBlock[] } | undefined][] = Object.entries(book.frontMatter ?? {});
  const backMatterSections: [string, { blocks: BookBlock[] } | undefined][] = Object.entries(book.backMatter ?? {});

  const allBlocks = [
    ...book.chapters.flatMap((chapter) => (chapter.blocks ?? []).map((block) => ({ block, context: chapter.title }))),
    ...frontMatterSections.flatMap(([slot, section]) => (section?.blocks ?? []).map((block) => ({ block, context: slot }))),
    ...backMatterSections.flatMap(([slot, section]) => (section?.blocks ?? []).map((block) => ({ block, context: slot }))),
  ];

  for (const { block, context } of allBlocks) {
    if (block.type === BookBlockType.IMAGE) {
      if (!block.image) {
        errors.push({ code: "MISSING_IMAGE", message: `An image block in "${context}" has no image.` });
      } else if ((block.image.width ?? 0) < LOW_RESOLUTION_WIDTH_PX) {
        warnings.push({ code: "LOW_RESOLUTION_IMAGE", message: `An image in "${context}" is lower resolution than recommended for print (${block.image.width}px wide).` });
      }
    }
    if (block.type === BookBlockType.RECIPE_REF) {
      const recipe = await recipeRepository.findOne({ where: { _id: block.recipeId, status: ContentStatus.PUBLISHED }, skipThrowError: true });
      if (!recipe) {
        errors.push({ code: "BROKEN_RECIPE_REF", message: `A recipe reference in "${context}" no longer points to a published recipe.` });
      }
    }
    if (block.type === BookBlockType.CITATION) {
      const exists = book.references.some((reference) => reference.id === block.referenceId);
      if (!exists) {
        errors.push({ code: "BROKEN_CITATION", message: `A citation in "${context}" no longer points to an existing reference.` });
      }
    }
  }

  if (!identity.doctorName?.trim() && !identity.doctorBio?.trim()) {
    warnings.push({ code: "MISSING_DOCTOR_IDENTITY", message: "Neither a doctor name nor a bio is resolved for this book (from Book Settings or an override)." });
  }

  return { errors, warnings };
}
