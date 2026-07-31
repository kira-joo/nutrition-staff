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

function renderFact(label: string, value: LocalizedString | undefined): string {
  const picked = pickText(value);
  if (!picked) return "";
  return (
    `<span class="fact"><span class="fact-label">${escapeHtml(label)}</span>` +
    `<span class="fact-value" dir="${picked.dir}">${escapeHtml(picked.text)}</span></span>`
  );
}

/**
 * Embeds the recipe's image as a data URI so the PDF renderer never depends
 * on network access at render time (see `fetchImageAsDataUri`). A recipe
 * whose image can't be fetched/embedded still exports — just without an
 * image area — rather than failing the whole multi-recipe export over one
 * broken asset.
 */
async function renderRecipeImage(recipe: PopulatedRecipe): Promise<string> {
  try {
    const dataUri = await fetchImageAsDataUri(recipe.image.secureUrl);
    return `<div class="image-area"><img src="${dataUri}" alt="" /></div>`;
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
  // The whole page's reading direction follows its title's picked
  // language — the one signal that reliably represents "which language
  // this recipe is really in" when fields could each independently fall
  // back to Arabic. This also mirrors the ingredients/instructions column
  // order (via `border-inline-start`, a logical property) so an
  // Arabic-dominant recipe reads right-to-left as a whole, not just
  // per-field.
  const pageDir = titlePicked?.dir ?? "ltr";

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

  const factsHtml = [renderFact("Prep", recipe.prepTime), renderFact("Cook", recipe.cookTime), renderFact("Servings", recipe.servings)].join("");

  const ingredientsList = renderList(recipe.ingredients, false);
  const instructionsList = renderList(recipe.instructions, true);

  return (
    `<section class="recipe-page${isLast ? "" : " page-break"}" dir="${pageDir}">` +
    image +
    `<div class="header-block">` +
    `<h1>${title}</h1>` +
    tagsHtml +
    descriptionHtml +
    (factsHtml ? `<div class="facts-row">${factsHtml}</div>` : "") +
    `</div>` +
    (ingredientsList || instructionsList
      ? `<div class="content-columns">` +
        (ingredientsList ? `<div class="column">${"<h2>Ingredients</h2>"}${ingredientsList}</div>` : "") +
        (instructionsList ? `<div class="column">${"<h2>Instructions</h2>"}${instructionsList}</div>` : "") +
        `</div>`
      : "") +
    `</section>`
  );
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #1e293b; margin: 0; }
  [dir="rtl"] { text-align: right; }

  /*
   * Exactly one recipe per page: a forced break after every recipe except
   * the last (a trailing break on the very last element would otherwise
   * risk an extra blank page). "vh"/"vw" are avoided throughout this file
   * on purpose — Puppeteer's print pipeline resolves them against the
   * browser's viewport, not the physical A4 page, so real physical units
   * (mm) are used instead wherever a size needs to track actual page
   * dimensions (see .image-area below).
   */
  .recipe-page { padding: 14px 32px 24px; }
  .recipe-page.page-break { page-break-after: always; }

  /*
   * Image area: ~45% of the ~265mm printable A4 height (297mm page minus
   * the renderer's 16mm top+bottom margins) — comfortably inside the
   * requested 40-50% band. object-fit: contain inside a centered flex box
   * handles portrait and landscape source images identically: the image
   * is scaled down (never up past its natural size, via max-width/height
   * 100%) to fit the box without stretching or cropping, and centers
   * inside whatever letterboxing results.
   */
  .image-area { width: 100%; height: 120mm; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f8fafc; border-radius: 8px; margin-bottom: 14px; }
  .image-area img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }

  /*
   * Header block (title/tags/description/facts): always small regardless
   * of recipe length, so "avoid" here is cheap and safe — it never risks
   * the large wasted-blank-space problem a bigger avoided block could
   * cause (see .content-columns below, which deliberately does NOT use
   * break-inside: avoid for exactly that reason).
   */
  .header-block { break-inside: avoid; }
  h1 { font-size: 19px; margin: 0 0 6px; line-height: 1.25; }
  .tags { margin-bottom: 6px; }
  .tag { display: inline-block; background: #f1f5f9; color: #334155; border-radius: 999px; padding: 2px 10px; margin-inline-end: 5px; margin-bottom: 4px; font-size: 10.5px; }
  .tag-category { background: #e0f2fe; color: #075985; }
  .description { font-size: 11.5px; line-height: 1.5; margin: 0 0 8px; color: #475569; }
  .facts-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 10px; padding: 8px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; break-inside: avoid; }
  .fact { display: flex; align-items: baseline; gap: 5px; font-size: 11px; }
  .fact-label { color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; font-size: 9.5px; }
  .fact-value { color: #1e293b; }

  /*
   * Ingredients | Instructions, side by side with a subtle divider —
   * mirrors automatically under dir="rtl" via the logical (inline-start)
   * border/padding below. Deliberately NOT break-inside: avoid on
   * .content-columns or .column: a long recipe's list is often taller than
   * the remaining space on its image's page, and avoiding a break on the
   * whole (long) block would shove all of it onto a fresh page, leaving a
   * large blank gap under the image instead of actually using that space —
   * exactly the "mostly-empty continuation page" outcome to avoid. Letting
   * it flow means a long recipe starts filling ingredients/instructions
   * right under the header, then continues normally onto the next page
   * only for the genuine overflow. Each individual line still avoids
   * splitting mid-item.
   */
  .content-columns { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; }
  .column { min-width: 0; }
  .column + .column { border-inline-start: 1px solid #e2e8f0; padding-inline-start: 24px; margin-inline-start: -24px; }
  .column h2 { font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.04em; color: #334155; break-inside: avoid; }
  ul, ol { font-size: 11px; line-height: 1.55; padding-inline-start: 16px; margin: 0; }
  li { break-inside: avoid; margin-bottom: 4px; }
`;

/**
 * Builds one self-contained HTML document covering every given recipe, one
 * per A4 page (see `renderHtmlToPdf` in `@kira-joo/backend-toolkit-next`
 * for the actual PDF rendering step): a large image area on top, all of
 * the recipe's content below it. A normal recipe fits entirely on its one
 * page; only a genuinely long one continues naturally onto a further page
 * rather than ever shrinking to fit. Recipe-specific layout/fields live
 * here, deliberately outside any generic toolkit package.
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
