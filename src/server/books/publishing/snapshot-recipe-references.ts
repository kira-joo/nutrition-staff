import { BookBlockType } from "src/common/enums";
import type { FrozenBookContent } from "src/server/books/editions/book-edition.schema";
import type { RecipeSnapshot } from "src/server/books/editions/book-edition.schema";
import { recipeRepository } from "src/server/recipes/recipes.repository";

function collectRecipeIds(content: FrozenBookContent): string[] {
  const ids = new Set<string>();
  const allBlocks = [
    ...content.chapters.flatMap((chapter) => chapter.blocks ?? []),
    ...Object.values(content.frontMatter ?? {}).flatMap((slot) => slot?.blocks ?? []),
    ...Object.values(content.backMatter ?? {}).flatMap((slot) => slot?.blocks ?? []),
  ];
  for (const block of allBlocks) {
    if (block.type === BookBlockType.RECIPE_REF) ids.add(block.recipeId);
  }
  return [...ids];
}

/**
 * Freezes exactly what a `RECIPE_REF` block needs to render independently
 * of the live Recipe module — per BOOK_PLAN §15: "changing the website
 * Recipe afterward must NOT retroactively change an already-published
 * book edition." The current template's `RECIPE_REF` rendering is still
 * a minimal placeholder (see Phase D's `render-block.ts`), so nothing
 * consumes this snapshot's fields yet — it exists now so a later renderer
 * improvement reads frozen data by construction, never live Recipe data,
 * without needing a migration to backfill historical Editions.
 */
export async function snapshotRecipeReferences(content: FrozenBookContent): Promise<Record<string, RecipeSnapshot>> {
  const recipeIds = collectRecipeIds(content);
  const snapshots: Record<string, RecipeSnapshot> = {};

  for (const recipeId of recipeIds) {
    const recipe = await recipeRepository.findOne({ where: { _id: recipeId }, skipThrowError: true });
    if (!recipe) continue;
    snapshots[recipeId] = {
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
    };
  }

  return snapshots;
}
