import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { RecipeModel } from "src/server/recipes/recipe.schema";

export const recipeRepository = createMongooseRepository({
  model: RecipeModel,
  entityName: EntityName.RECIPE,
});
