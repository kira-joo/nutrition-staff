import { createGetRoute } from "src/server/core/route-factories";
import { recipeCategoryRepository } from "src/server/recipe-categories/recipe-categories.repository";
import { ContentStatus } from "src/common/enums";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// same "backend complete" convention as every other module.
export const GET = createGetRoute({
  auth: false,
  handler: async () =>
    recipeCategoryRepository.findAllNoCountPublic({ where: { status: ContentStatus.PUBLISHED } }),
});
