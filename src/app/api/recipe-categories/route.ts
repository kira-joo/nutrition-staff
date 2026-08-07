import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { RECIPE_CATEGORIES_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { CreateRecipeCategoryDto } from "src/server/recipe-categories/dto/create-recipe-category.dto";
import { ListRecipeCategoriesQueryDto } from "src/server/recipe-categories/dto/list-recipe-categories-query.dto";
import { recipeCategoryRepository } from "src/server/recipe-categories/recipe-categories.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListRecipeCategoriesQueryDto,
  auth: { permissions: [AppPermission.RECIPE_CATEGORY.READ] },
  handler: async ({ query }) => recipeCategoryRepository.findAllAndCountPublic({ query }),
});

export const POST = createPostRoute({
  body: CreateRecipeCategoryDto,
  auth: { permissions: [AppPermission.RECIPE_CATEGORY.CREATE] },
  handler: async ({ body }) => {
    assertPublishReady(body, body.status);
    return recipeCategoryRepository.save(body);
  },
  revalidateTags: RECIPE_CATEGORIES_TAGS,
});
