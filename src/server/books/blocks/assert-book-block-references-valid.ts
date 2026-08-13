import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { BookBlockType, ContentStatus } from "src/common/enums";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";
import { recipeRepository } from "src/server/recipes/recipes.repository";

/**
 * DB-backed / cross-field checks a sync class-validator decorator can't
 * express — mirrors `assertBlockReferencesValid` in
 * `src/server/campaigns/blocks/assert-block-references-valid.ts`. Called
 * after `validateBookBlock` passes structural validation, from every
 * add/replace entry point.
 */
export async function assertBookBlockReferencesValid(dto: Record<string, unknown>, references: BookReference[]): Promise<void> {
  const referenceIds = new Set(references.map((reference) => reference.id));

  if (dto.type === BookBlockType.RECIPE_REF) {
    const recipeId = dto.recipeId as string;
    const recipe = await recipeRepository.findOne({ where: { _id: recipeId, status: ContentStatus.PUBLISHED }, skipThrowError: true });
    if (!recipe) {
      throw new BadRequestError(`Recipe "${recipeId}" does not exist, is deleted, or is not published.`, { recipeId });
    }
  }

  if (dto.type === BookBlockType.CITATION) {
    const referenceId = dto.referenceId as string;
    if (!referenceIds.has(referenceId)) {
      throw new BadRequestError(`Reference "${referenceId}" does not exist on this book.`, { referenceId });
    }
  }

  const citationIds = (dto.citationIds as string[] | undefined) ?? [];
  const unknownCitationIds = citationIds.filter((id) => !referenceIds.has(id));
  if (unknownCitationIds.length > 0) {
    throw new BadRequestError(`citationIds reference unknown entries: ${unknownCitationIds.join(", ")}.`, { unknownCitationIds });
  }
}
