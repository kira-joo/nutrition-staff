import { createGetRoute } from "src/server/core/route-factories";
import { recipeFoodGroupRepository } from "src/server/recipe-food-groups/recipe-food-groups.repository";
import { ContentStatus } from "src/common/enums";

export const GET = createGetRoute({
  auth: false,
  handler: async () =>
    recipeFoodGroupRepository.findAllNoCountPublic({ where: { status: ContentStatus.PUBLISHED } }),
});
