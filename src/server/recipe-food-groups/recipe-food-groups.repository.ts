import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { RecipeFoodGroupModel } from "src/server/recipe-food-groups/recipe-food-group.schema";

export const recipeFoodGroupRepository = createMongooseRepository({
  model: RecipeFoodGroupModel,
  entityName: EntityName.RECIPE_FOOD_GROUP,
});
