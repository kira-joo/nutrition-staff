import { createDtoRequirednessResolver, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import { assertPublishReady } from "src/server/core/publishing";
import { assetProvider, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { RECIPES_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { CreateRecipeDto } from "src/server/recipes/dto/create-recipe.dto";
import { ListRecipesQueryDto } from "src/server/recipes/dto/list-recipes-query.dto";
import { RECIPE_ASSET_FIELDS, RECIPE_ASSET_FOLDER } from "src/server/recipes/recipe-asset-fields";
import { recipeRepository } from "src/server/recipes/recipes.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListRecipesQueryDto,
  auth: { permissions: [AppPermission.RECIPE.READ] },
  handler: async ({ query }) => recipeRepository.findAllAndCountPublic({ query, relations: ["category", "foodGroups"] }),
});

// No `body` here on purpose — always multipart/form-data (upload-on-submit).
export const POST = createPostRoute({
  auth: { permissions: [AppPermission.RECIPE.CREATE] },
  handler: async ({ request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: RECIPE_ASSET_FIELDS,
      provider: assetProvider,
      folder: RECIPE_ASSET_FOLDER,
    });

    try {
      const dto = await validateDto(CreateRecipeDto, payload);
      assertPublishReady(dto, dto.status, createDtoRequirednessResolver(CreateRecipeDto, dto));
      return await recipeRepository.save(dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }
  },
  revalidateTags: RECIPES_TAGS,
});
