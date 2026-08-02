import { NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import {
  authenticateRequest,
  authorizeUser,
  createErrorResponse,
  createPdfResponse,
  getNextBackendToolkitConfig,
  parseRequestBody,
  renderHtmlToPdf,
} from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { AppPermission } from "src/server/core/authorization/authorization-registry";

export const dynamic = "force-dynamic";

// Side-effect import: every route.ts must trigger this itself — Next.js dev
// mode compiles each route as a separate bundle, so configuration done by
// another route's own import of this file isn't visible here. Routes built
// on `createGetRoute`/`createPostRoute` get this for free via
// `route-factories.ts`; this route bypasses those factories (see below), so
// it must import it directly.
import "src/server/core/toolkit.config";
import { ExportRecipesPdfDto } from "src/server/recipes/dto/export-recipes-pdf.dto";
import { buildRecipesPdfHtml, type PopulatedRecipe } from "src/server/recipes/recipe-pdf-template";
import { recipeRepository } from "src/server/recipes/recipes.repository";

const AUTH_OPTION = { permissions: [AppPermission.RECIPE.READ] };

// A raw PDF response can't go through `createRoute`/`createPostRoute` — the
// factory always serializes the handler's return value with
// `createSuccessResponse` (`NextResponse.json`), which would corrupt a
// binary body. This route composes the same underlying pieces
// (`authenticateRequest`/`authorizeUser`/`createErrorResponse`) by hand
// instead, exactly as `createRoute` itself does internally, so it stays on
// the same auth/error-handling guarantees as every other route.
export async function POST(request: NextRequest) {
  try {
    const config = getNextBackendToolkitConfig();
    await config.database.connect();

    const user = await authenticateRequest({ request, config, authOption: AUTH_OPTION });
    authorizeUser(user, AUTH_OPTION);

    const rawBody = await parseRequestBody(request);
    const dto = await validateDto(ExportRecipesPdfDto, rawBody);

    // The client sends only ids — recipes are always re-fetched here, never
    // trusted/reconstructed from anything the client supplied.
    const recipes = (await recipeRepository.findByIds(dto.ids, {
      relations: ["category", "foodGroups"],
    })) as unknown as PopulatedRecipe[];

    const foundIds = new Set(recipes.map((recipe) => recipe._id.toString()));
    const missingIds = dto.ids.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new NotFoundError(`No recipe exists (or is accessible) for id(s): ${missingIds.join(", ")}`, {
        missingIds,
      });
    }

    // Preserve the order the client selected them in, not the DB's order.
    const recipesById = new Map(recipes.map((recipe) => [recipe._id.toString(), recipe]));
    const orderedRecipes = dto.ids.map((id) => recipesById.get(id)).filter((recipe): recipe is PopulatedRecipe => Boolean(recipe));

    const html = await buildRecipesPdfHtml(orderedRecipes);
    const pdf = await renderHtmlToPdf(html);

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename =
      orderedRecipes.length === 1
        ? `${(orderedRecipes[0].title.en || orderedRecipes[0].title.ar || "recipe").trim()}.pdf`
        : `recipes-export-${dateStamp}.pdf`;

    return createPdfResponse(pdf, { filename });
  } catch (error) {
    return createErrorResponse(error);
  }
}
