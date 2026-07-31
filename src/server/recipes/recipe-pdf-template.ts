import { fetchImageAsDataUri, PdfImageFetchError } from "@kira-joo/backend-toolkit-next";
import type { LocalizedString } from "@kira-joo/toolkit-common";

// Shape of a Recipe once `category`/`foodGroups` have been populated via
// `relations` — the repository's own return type stays `RecipeSchema`
// (ObjectId refs) regardless of `relations`, so this reflects what's
// actually on the object at runtime, the same gap the client-side `Recipe`
// interface documents with its `RecipeCategory | string` union.
export interface PopulatedRecipe {
  _id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: { secureUrl: string };
  category?: { title: LocalizedString };
  foodGroups: { title: LocalizedString }[];
  ingredients: LocalizedString[];
  instructions: LocalizedString[];
  prepTime?: LocalizedString;
  cookTime?: LocalizedString;
  servings?: LocalizedString;
}

interface PickedText {
  text: string;
  dir: "ltr" | "rtl";
}

// Export language: the backoffice's own chrome (this file's static English
// labels — "Ingredients", "Prep time", etc.) has no locale-switching
// mechanism anywhere in nutrition-staff today, so there is no real "current
// backoffice locale" to read beyond English. Rather than build new
// export-language-choice UI/infrastructure for this one feature, each
// piece of recipe CONTENT independently prefers English and falls back to
// Arabic per field when English is empty — so a recipe with incomplete
// English translations still exports full, readable content instead of
// blank sections.
function pickText(value: LocalizedString | undefined): PickedText | undefined {
  const en = value?.en?.trim();
  if (en) return { text: en, dir: "ltr" };

  const ar = value?.ar?.trim();
  if (ar) return { text: ar, dir: "rtl" };

  return undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderList(items: LocalizedString[], ordered: boolean): string {
  const itemsHtml = items
    .map((item) => pickText(item))
    .filter((picked): picked is PickedText => Boolean(picked))
    .map((picked) => `<li dir="${picked.dir}">${escapeHtml(picked.text)}</li>`)
    .join("");

  if (!itemsHtml) return "";
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${itemsHtml}</${tag}>`;
}

function renderFactRow(label: string, value: LocalizedString | undefined): string {
  const picked = pickText(value);
  if (!picked) return "";
  return `<tr><th>${escapeHtml(label)}</th><td dir="${picked.dir}">${escapeHtml(picked.text)}</td></tr>`;
}

/**
 * Embeds the recipe's image as a data URI so the PDF renderer never depends
 * on network access at render time (see `fetchImageAsDataUri`). A recipe
 * whose image can't be fetched/embedded still exports — just without an
 * image block — rather than failing the whole multi-recipe export over one
 * broken asset.
 */
async function renderRecipeImage(recipe: PopulatedRecipe): Promise<string> {
  try {
    const dataUri = await fetchImageAsDataUri(recipe.image.secureUrl);
    return `<img class="recipe-image" src="${dataUri}" alt="" />`;
  } catch (error) {
    if (error instanceof PdfImageFetchError) {
      console.error(`[recipe-pdf-export] Skipping image for recipe ${recipe._id}: ${error.message}`);
      return "";
    }
    throw error;
  }
}

async function renderRecipePage(recipe: PopulatedRecipe, isLast: boolean): Promise<string> {
  const titlePicked = pickText(recipe.title);
  const title = titlePicked ? escapeHtml(titlePicked.text) : "Untitled recipe";
  const titleDir = titlePicked?.dir ?? "ltr";

  const image = await renderRecipeImage(recipe);

  const categoryPicked = pickText(recipe.category?.title);
  const foodGroupTagsHtml = recipe.foodGroups
    .map((group) => pickText(group.title))
    .filter((picked): picked is PickedText => Boolean(picked))
    .map((picked) => `<span class="tag" dir="${picked.dir}">${escapeHtml(picked.text)}</span>`)
    .join("");
  const categoryTagHtml = categoryPicked
    ? `<span class="tag tag-category" dir="${categoryPicked.dir}">${escapeHtml(categoryPicked.text)}</span>`
    : "";
  const tagsHtml = categoryTagHtml || foodGroupTagsHtml ? `<div class="tags">${categoryTagHtml}${foodGroupTagsHtml}</div>` : "";

  const descriptionPicked = pickText(recipe.description);
  const descriptionHtml = descriptionPicked
    ? `<p class="description" dir="${descriptionPicked.dir}">${escapeHtml(descriptionPicked.text)}</p>`
    : "";

  const factsRowsHtml = [
    renderFactRow("Prep time", recipe.prepTime),
    renderFactRow("Cook time", recipe.cookTime),
    renderFactRow("Servings", recipe.servings),
  ].join("");
  const factsHtml = factsRowsHtml ? `<table class="facts">${factsRowsHtml}</table>` : "";

  const ingredientsList = renderList(recipe.ingredients, false);
  const ingredientsHtml = ingredientsList ? `<h2>Ingredients</h2>${ingredientsList}` : "";

  const instructionsList = renderList(recipe.instructions, true);
  const instructionsHtml = instructionsList ? `<h2>Instructions</h2>${instructionsList}` : "";

  return (
    `<section class="recipe-page${isLast ? "" : " page-break"}">` +
    `<h1 dir="${titleDir}">${title}</h1>` +
    image +
    tagsHtml +
    descriptionHtml +
    factsHtml +
    ingredientsHtml +
    instructionsHtml +
    `</section>`
  );
}

const STYLES = `
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #1e293b; margin: 0; }
  .recipe-page.page-break { page-break-after: always; }
  h1 { font-size: 24px; margin: 0 0 12px; }
  h2 { font-size: 16px; margin: 20px 0 8px; }
  .recipe-image { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 12px; display: block; }
  .tags { margin-bottom: 12px; }
  .tag { display: inline-block; background: #f1f5f9; color: #334155; border-radius: 999px; padding: 4px 12px; margin: 0 6px 6px 0; font-size: 12px; }
  .tag-category { background: #e0f2fe; color: #075985; }
  .description { font-size: 14px; line-height: 1.6; margin-bottom: 12px; }
  table.facts { border-collapse: collapse; margin-bottom: 12px; }
  table.facts th { text-align: left; padding: 4px 12px 4px 0; color: #64748b; font-weight: 600; font-size: 12px; }
  table.facts td { padding: 4px 0; font-size: 13px; }
  ul, ol { font-size: 13px; line-height: 1.7; padding-inline-start: 20px; margin: 0 0 12px; }
  [dir="rtl"] { text-align: right; }
`;

/**
 * Builds one self-contained HTML document covering every given recipe, one
 * per page (see `renderHtmlToPdf` in `@kira-joo/backend-toolkit-next` for
 * the actual PDF rendering step). Recipe-specific layout/fields live here,
 * deliberately outside any generic toolkit package.
 */
export async function buildRecipesPdfHtml(recipes: PopulatedRecipe[]): Promise<string> {
  const pages = await Promise.all(
    recipes.map((recipe, index) => renderRecipePage(recipe, index === recipes.length - 1))
  );

  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${STYLES}</style></head>` +
    `<body>${pages.join("")}</body></html>`
  );
}
