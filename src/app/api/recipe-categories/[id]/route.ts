import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { RECIPE_CATEGORIES_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { FindRecipeCategoryParamsDto } from "src/server/recipe-categories/dto/find-recipe-category-params.dto";
import { UpdateRecipeCategoryDto } from "src/server/recipe-categories/dto/update-recipe-category.dto";
import { recipeCategoryRepository } from "src/server/recipe-categories/recipe-categories.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindRecipeCategoryParamsDto,
  auth: { permissions: [AppPermission.RECIPE_CATEGORY.READ_ONE] },
  handler: async ({ params }) => recipeCategoryRepository.findOne({ where: { _id: params.id } }),
});

export const PUT = createPutRoute({
  params: FindRecipeCategoryParamsDto,
  body: UpdateRecipeCategoryDto,
  auth: { permissions: [AppPermission.RECIPE_CATEGORY.UPDATE] },
  handler: async ({ params, body }) => {
    const existing = await recipeCategoryRepository.findOne({ where: { _id: params.id } });
    const nextStatus = body.status ?? existing.status;
    assertPublishReady({ ...existing, ...body }, nextStatus);
    return recipeCategoryRepository.update({ where: { _id: params.id } }, body);
  },
  revalidateTags: RECIPE_CATEGORIES_TAGS,
});

export const DELETE = createDeleteRoute({
  params: FindRecipeCategoryParamsDto,
  auth: { permissions: [AppPermission.RECIPE_CATEGORY.DELETE] },
  handler: async ({ params }) => {
    await recipeCategoryRepository.softDelete({ where: { _id: params.id } });
  },
  revalidateTags: RECIPE_CATEGORIES_TAGS,
});
