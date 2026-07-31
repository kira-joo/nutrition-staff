import { createGetRoute } from "src/server/core/route-factories";
import { FindRecipeParamsDto } from "src/server/recipes/dto/find-recipe-params.dto";
import { recipeRepository } from "src/server/recipes/recipes.repository";
import { ContentStatus } from "src/common/enums";

export const GET = createGetRoute({
  params: FindRecipeParamsDto,
  auth: false,
  handler: async ({ params }) =>
    recipeRepository.findOne({
      where: { _id: params.id, status: ContentStatus.PUBLISHED },
      relations: ["category", "foodGroups"],
    }),
});
