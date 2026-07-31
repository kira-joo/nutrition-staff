import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { RecipeCategoryModel } from "src/server/recipe-categories/recipe-category.schema";

export const recipeCategoryRepository = createMongooseRepository({
  model: RecipeCategoryModel,
  entityName: EntityName.RECIPE_CATEGORY,
});
