import { validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import {
  assetProvider,
  destroyReplacedAssets,
  destroyUploadedAssets,
  processAssetUploadFields,
} from "src/server/core/assets";
import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { revalidateRecipes } from "src/server/core/revalidation/revalidate-entity";
import { FindRecipeParamsDto } from "src/server/recipes/dto/find-recipe-params.dto";
import { UpdateRecipeDto } from "src/server/recipes/dto/update-recipe.dto";
import { RECIPE_ASSET_FIELDS, RECIPE_ASSET_FOLDER } from "src/server/recipes/recipe-asset-fields";
import { recipeRepository } from "src/server/recipes/recipes.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindRecipeParamsDto,
  auth: { permissions: [AppPermission.RECIPE.READ_ONE] },
  handler: async ({ params }) =>
    recipeRepository.findOne({ where: { _id: params.id }, relations: ["category", "foodGroups"] }),
});

// No `body` here — same multipart-only convention as the collection route.
export const PUT = createPutRoute({
  params: FindRecipeParamsDto,
  auth: { permissions: [AppPermission.RECIPE.UPDATE] },
  handler: async ({ params, request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const previousDocument = await recipeRepository.findOne({ where: { _id: params.id } });

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: RECIPE_ASSET_FIELDS,
      provider: assetProvider,
      folder: RECIPE_ASSET_FOLDER,
    });

    let saved;
    try {
      const dto = await validateDto(UpdateRecipeDto, payload);
      const nextStatus = dto.status ?? previousDocument.status;
      assertPublishReady({ ...previousDocument, ...dto }, nextStatus);
      saved = await recipeRepository.update({ where: { _id: params.id } }, dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }

    await destroyReplacedAssets({
      provider: assetProvider,
      fields: RECIPE_ASSET_FIELDS,
      files,
      payload,
      previousDocument: previousDocument as unknown as Record<string, unknown>,
    });

    await revalidateRecipes(params.id);
    return saved;
  },
});

export const DELETE = createDeleteRoute({
  params: FindRecipeParamsDto,
  auth: { permissions: [AppPermission.RECIPE.DELETE] },
  handler: async ({ params }) => {
    await recipeRepository.softDelete({ where: { _id: params.id } });
    await revalidateRecipes(params.id);
  },
});
