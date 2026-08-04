import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { revalidateRecipeFoodGroups } from "src/server/core/revalidation/revalidate-entity";
import { FindRecipeFoodGroupParamsDto } from "src/server/recipe-food-groups/dto/find-recipe-food-group-params.dto";
import { UpdateRecipeFoodGroupDto } from "src/server/recipe-food-groups/dto/update-recipe-food-group.dto";
import { recipeFoodGroupRepository } from "src/server/recipe-food-groups/recipe-food-groups.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindRecipeFoodGroupParamsDto,
  auth: { permissions: [AppPermission.RECIPE_FOOD_GROUP.READ_ONE] },
  handler: async ({ params }) => recipeFoodGroupRepository.findOne({ where: { _id: params.id } }),
});

export const PUT = createPutRoute({
  params: FindRecipeFoodGroupParamsDto,
  body: UpdateRecipeFoodGroupDto,
  auth: { permissions: [AppPermission.RECIPE_FOOD_GROUP.UPDATE] },
  handler: async ({ params, body }) => {
    const existing = await recipeFoodGroupRepository.findOne({ where: { _id: params.id } });
    const nextStatus = body.status ?? existing.status;
    assertPublishReady({ ...existing, ...body }, nextStatus);
    const updated = await recipeFoodGroupRepository.update({ where: { _id: params.id } }, body);
    await revalidateRecipeFoodGroups();
    return updated;
  },
});

export const DELETE = createDeleteRoute({
  params: FindRecipeFoodGroupParamsDto,
  auth: { permissions: [AppPermission.RECIPE_FOOD_GROUP.DELETE] },
  handler: async ({ params }) => {
    await recipeFoodGroupRepository.softDelete({ where: { _id: params.id } });
    await revalidateRecipeFoodGroups();
  },
});
