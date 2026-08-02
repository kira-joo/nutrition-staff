import { createGetRoute } from "src/server/core/route-factories";
import { PublicListRecipesQueryDto } from "src/server/recipes/dto/public-list-recipes-query.dto";
import { recipeRepository } from "src/server/recipes/recipes.repository";
import { ContentStatus } from "src/common/enums";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// same "backend complete" convention as every other module. Always
// hardcodes status: published; the query DTO has no status field at all.
export const GET = createGetRoute({
  query: PublicListRecipesQueryDto,
  auth: false,
  handler: async ({ query }) =>
    recipeRepository.findAllAndCountPublic({
      query,
      where: { status: ContentStatus.PUBLISHED },
      relations: ["category", "foodGroups"],
    }),
});
