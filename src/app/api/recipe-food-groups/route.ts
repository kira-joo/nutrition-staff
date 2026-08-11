import { createDtoRequirednessResolver } from "@kira-joo/backend-toolkit-core";
import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { RECIPE_FOOD_GROUPS_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { CreateRecipeFoodGroupDto } from "src/server/recipe-food-groups/dto/create-recipe-food-group.dto";
import { ListRecipeFoodGroupsQueryDto } from "src/server/recipe-food-groups/dto/list-recipe-food-groups-query.dto";
import { recipeFoodGroupRepository } from "src/server/recipe-food-groups/recipe-food-groups.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListRecipeFoodGroupsQueryDto,
  auth: { permissions: [AppPermission.RECIPE_FOOD_GROUP.READ] },
  handler: async ({ query }) => recipeFoodGroupRepository.findAllAndCountPublic({ query }),
});

export const POST = createPostRoute({
  body: CreateRecipeFoodGroupDto,
  auth: { permissions: [AppPermission.RECIPE_FOOD_GROUP.CREATE] },
  handler: async ({ body }) => {
    assertPublishReady(body, body.status, createDtoRequirednessResolver(CreateRecipeFoodGroupDto, body));
    return recipeFoodGroupRepository.save(body);
  },
  revalidateTags: RECIPE_FOOD_GROUPS_TAGS,
});
